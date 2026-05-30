import { Component, signal, inject, OnInit, OnDestroy, computed, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CoursesService, Channel } from '../../../shared/services/courses.service';
import { SpinnerService } from '../../../shared/services/spinner.service';
import { WebSocketService, Message, Announcement } from '../../../shared/services/websocket.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  selector: 'app-channel-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-content.component.html',
  host: {
    class: 'flex-1 flex flex-col min-h-0',
  },
})
export class ChannelContentComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coursesService = inject(CoursesService);
  private spinnerService = inject(SpinnerService);
  private wsService = inject(WebSocketService);
  private messagesService = inject(MessagesService);
  private auth = inject(AuthService);
  private alert = inject(AlertService);

  channel = signal<Channel | null>(null);
  loading = signal(true);
  newMessage = signal('');
  sendingMessage = signal(false);
  showMessagesEmpty = signal(true);

  private paramSub?: Subscription;
  private scrollContainer: ElementRef | null = null;

  messagesContainer = viewChild<ElementRef>('messagesContainer');

  currentUserId = computed(() => this.auth.currentUser()?.userId ?? null);

  messages = computed(() => {
    const ch = this.channel();
    if (ch?.type !== 'TEXT') return [];
    return this.wsService.messages();
  });

  announcements = computed(() => {
    const ch = this.channel();
    if (ch?.type !== 'ANNOUNCEMENT') return [];
    return this.wsService.announcements();
  });

  channelIcon(ch: Channel): string {
    if (ch.icon) return ch.icon;
    const icons: Record<string, string> = {
      TEXT: 'chat',
      ANNOUNCEMENT: 'campaign',
      TASKS: 'assignment',
      VOICE: 'mic',
      FORUM: 'forum',
      RESOURCES: 'folder',
    };
    return icons[ch.type] ?? 'tag';
  }

  constructor() {
    effect(() => {
      const msgs = this.messages();
      this.showMessagesEmpty.set(msgs.length === 0);
      if (msgs.length > 0) {
        this.scrollToBottom();
      }
    });
  }

  ngOnInit() {
    const parentRoute = this.route.parent;
    if (!parentRoute) {
      this.loading.set(false);
      return;
    }

    this.paramSub = combineLatest([parentRoute.paramMap, this.route.paramMap]).subscribe(
      ([parentParams, childParams]) => {
        const courseId = Number(parentParams.get('id'));
        const channelIndex = Number(childParams.get('channelIndex'));

        if (courseId && !isNaN(channelIndex)) {
          this.loading.set(true);
          this.spinnerService.show();
          this.loadChannel(courseId, channelIndex);
        } else {
          this.loading.set(false);
          this.spinnerService.hide();
        }
      },
    );
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
    const ch = this.channel();
    if (ch) {
      this.wsService.leaveChannel(ch.id);
    }
  }

  private loadChannel(courseId: number, channelIndex: number) {
    this.coursesService.getChannels(courseId).subscribe({
      next: (res) => {
        const items = res.channels?.items ?? [];
        if (channelIndex >= 0 && channelIndex < items.length) {
          const ch = items[channelIndex];
          this.channel.set(ch);
          this.initChannel(ch);
        }
        this.loading.set(false);
        this.spinnerService.hide();
      },
      error: () => {
        this.loading.set(false);
        this.spinnerService.hide();
      },
    });
  }

  private initChannel(channel: Channel) {
    console.log('[Channel] initChannel:', channel);
    if (!this.wsService.connected()) {
      console.log('[Channel] WS not connected, connecting...');
      this.wsService.connect();
    } else {
      console.log('[Channel] WS already connected');
    }

    if (this.wsService.activeChannelId() && this.wsService.activeChannelId() !== channel.id) {
      console.log('[Channel] Leaving previous channel:', this.wsService.activeChannelId());
      this.wsService.leaveChannel(this.wsService.activeChannelId()!);
    }

    if (channel.type === 'TEXT' || channel.type === 'ANNOUNCEMENT') {
      console.log('[Channel] Joining channel:', channel.id);
      this.wsService.joinChannel(channel.id);
      this.loadChannelContent(channel);
    }
  }

  private loadChannelContent(channel: Channel) {
    console.log('[Channel] loadChannelContent:', channel.type);
    if (channel.type === 'TEXT') {
      console.log('[Channel] Loading messages via REST...');
      this.messagesService.getMessages(channel.id).subscribe({
        next: (messages) => {
          console.log('[Channel] Messages loaded:', messages.length, messages);
          this.wsService.messages.set(messages);
        },
        error: (err) => {
          this.alert.error(err.error?.message ?? 'Error loading messages');
        },
      });
    } else if (channel.type === 'ANNOUNCEMENT') {
      console.log('[Channel] Loading announcements via REST...');
      this.messagesService.getAnnouncements(channel.id).subscribe({
        next: (announcements) => {
          console.log('[Channel] Announcements loaded:', announcements.length);
          this.wsService.announcements.set(announcements);
        },
        error: (err) => {
          this.alert.error(err.error?.message ?? 'Error loading announcements');
        },
      });
    }
  }

  sendMessage() {
    const content = this.newMessage().trim();
    const ch = this.channel();
    console.log('[Channel] sendMessage called:', content, 'channel:', ch?.id);
    if (!content || !ch || ch.type !== 'TEXT') return;

    this.sendingMessage.set(true);
    this.messagesService.createMessage({ content, channelId: ch.id }).subscribe({
      next: () => {
        console.log('[Channel] Message sent successfully');
        this.newMessage.set('');
        this.sendingMessage.set(false);
      },
      error: (err) => {
        console.error('[Channel] Error sending message:', err);
        this.sendingMessage.set(false);
        this.alert.error(err.error?.message ?? 'Error sending message');
      },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  deleteMessage(messageId: number) {
    this.messagesService.deleteMessage(messageId).subscribe({
      error: (err) => {
        this.alert.error(err.error?.message ?? 'Error deleting message');
      },
    });
  }

  togglePin(announcementId: number) {
    this.messagesService.togglePinAnnouncement(announcementId).subscribe({
      error: (err) => {
        this.alert.error(err.error?.message ?? 'Error toggling pin');
      },
    });
  }

  deleteAnnouncement(announcementId: number) {
    this.messagesService.deleteAnnouncement(announcementId).subscribe({
      error: (err) => {
        this.alert.error(err.error?.message ?? 'Error deleting announcement');
      },
    });
  }

  isOwnMessage(msg: Message): boolean {
    return msg.userId === this.currentUserId();
  }

formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = this.messagesContainer();
      if (container?.nativeElement) {
        container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
      }
    }, 0);
  }

  trackByMessage(index: number, msg: Message): number {
    return msg.id;
  }

  trackByAnnouncement(index: number, ann: Announcement): number {
    return ann.id;
  }
}
