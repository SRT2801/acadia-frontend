import { Component, signal, inject, OnInit, OnDestroy, computed, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CoursesService, Channel } from '../../../shared/services/courses.service';
import { SpinnerService } from '../../../shared/services/spinner.service';
import { WebSocketService, Message, Announcement } from '../../../shared/services/websocket.service';
import { MessagesService } from '../../../shared/services/messages.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AlertService } from '../../../shared/services/alert.service';
import { LoggerService } from '../../../shared/utils/logger.service';
import { SoundService } from '../../../shared/services/sound.service';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';

@Component({
  selector: 'app-channel-content',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, DragDropModule],
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
  private logger = inject(LoggerService);
  private soundService = inject(SoundService);

  channel = signal<Channel | null>(null);
  loading = signal(true);
  newMessage = signal('');
  sendingMessage = signal(false);
  showMessagesEmpty = signal(true);

  private paramSub?: Subscription;
  private scrollContainer: ElementRef | null = null;

  messagesContainer = viewChild<ElementRef>('messagesContainer');

  currentUserId = computed(() => this.auth.currentUser()?.userId ?? null);

  canCreateAnnouncement = computed(() => {
    const role = this.auth.currentUser()?.roleName;
    return role === 'PROFESSOR' || role === 'ADMIN';
  });

  isAdmin = computed(() => this.auth.currentUser()?.roleName === 'ADMIN');

  showCreateAnnouncementDialog = signal(false);
  announcementTitle = signal('');
  announcementContent = signal('');
  announcementPriority = signal<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  announcementPinned = signal(false);
  creatingAnnouncement = signal(false);

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
    if (!this.wsService.connected()) {
      this.wsService.connect();
    }

    if (this.wsService.activeChannelId() && this.wsService.activeChannelId() !== channel.id) {
      this.wsService.leaveChannel(this.wsService.activeChannelId()!);
    }

    if (channel.type === 'TEXT' || channel.type === 'ANNOUNCEMENT') {
      this.wsService.joinChannel(channel.id);
      this.loadChannelContent(channel);
    }
  }

  private loadChannelContent(channel: Channel) {
    if (channel.type === 'TEXT') {
      this.messagesService.getMessages(channel.id).subscribe({
        next: (messages) => {
          this.wsService.messages.set(messages);
        },
        error: (err) => {
          this.alert.error(err.error?.message ?? 'Error loading messages');
        },
      });
    } else if (channel.type === 'ANNOUNCEMENT') {
      this.messagesService.getAnnouncements(channel.id).subscribe({
        next: (announcements) => {
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
    if (!content || !ch || ch.type !== 'TEXT') return;

    this.sendingMessage.set(true);
    this.messagesService.createMessage({ content, channelId: ch.id }).subscribe({
      next: () => {
        this.newMessage.set('');
        this.sendingMessage.set(false);
        this.soundService.playSendSound();
      },
      error: (err) => {
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
    const currentAnnouncements = this.wsService.announcements();
    const announcement = currentAnnouncements.find(a => a.id === announcementId);
    if (!announcement) return;

    const updatedAnn = { ...announcement, pinned: !announcement.pinned };
    const newAnnouncements = currentAnnouncements.map(a => a.id === announcementId ? updatedAnn : a);
    this.wsService.announcements.set(newAnnouncements);

    this.messagesService.togglePinAnnouncement(announcementId).subscribe({
      next: (ann) => {
        this.alert.success(ann.pinned ? 'Anuncio pinned' : 'Anuncio unpinned');
      },
      error: (err) => {
        this.wsService.announcements.set(currentAnnouncements);
        this.alert.error(err.error?.message ?? 'Error toggling pin');
      },
    });
  }

  deleteAnnouncement(announcementId: number) {
    const currentAnnouncements = this.wsService.announcements();
    const newAnnouncements = currentAnnouncements.filter(a => a.id !== announcementId);
    this.wsService.announcements.set(newAnnouncements);

    this.messagesService.deleteAnnouncement(announcementId).subscribe({
      next: () => {
        this.alert.success('Anuncio eliminado');
      },
      error: (err) => {
        this.wsService.announcements.set(currentAnnouncements);
        this.alert.error(err.error?.message ?? 'Error deleting announcement');
      },
    });
  }

  openCreateAnnouncementDialog(priority?: string) {
    this.announcementTitle.set('');
    this.announcementContent.set('');
    this.announcementPriority.set((priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') ?? 'NORMAL');
    this.announcementPinned.set(false);
    this.showCreateAnnouncementDialog.set(true);
  }

  closeCreateAnnouncementDialog() {
    this.showCreateAnnouncementDialog.set(false);
  }

  submitAnnouncement() {
    const title = this.announcementTitle().trim();
    const content = this.announcementContent().trim();
    const ch = this.channel();
    if (!title || !content || !ch || ch.type !== 'ANNOUNCEMENT') return;

    this.creatingAnnouncement.set(true);
    this.messagesService.createAnnouncement({
      title,
      content,
      channelId: ch.id,
      priority: this.announcementPriority(),
      pinned: this.announcementPinned(),
    }).subscribe({
      next: (announcement) => {
        this.wsService.announcements.update((anns) => [announcement, ...anns]);
        this.closeCreateAnnouncementDialog();
        this.creatingAnnouncement.set(false);
      },
      error: (err) => {
        this.creatingAnnouncement.set(false);
        this.alert.error(err.error?.message ?? 'Error creating announcement');
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

  getAnnouncementsByPriority(priority: string): Announcement[] {
    const pinned = this.announcements().filter((a) => a.priority === priority && a.pinned);
    const unpinned = this.announcements().filter((a) => a.priority === priority && !a.pinned);
    return [...pinned, ...unpinned];
  }

  getPriorityDotClass(priority: string): string {
    const classes: Record<string, string> = {
      URGENT: 'bg-error',
      HIGH: 'bg-tertiary',
      NORMAL: 'bg-primary',
      LOW: 'bg-secondary',
    };
    return classes[priority] ?? 'bg-on-surface-variant';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      URGENT: 'Urgente',
      HIGH: 'Alta',
      NORMAL: 'Normal',
      LOW: 'Baja',
    };
    return labels[priority] ?? priority;
  }

  getColumnBorderClass(priority: string): string {
    const classes: Record<string, string> = {
      URGENT: 'border-error/30',
      HIGH: 'border-tertiary/30',
      NORMAL: 'border-primary/30',
      LOW: 'border-secondary/30',
    };
    return classes[priority] ?? 'border-outline-variant';
  }

  getColumnTextClass(priority: string): string {
    const classes: Record<string, string> = {
      URGENT: 'text-error',
      HIGH: 'text-tertiary',
      NORMAL: 'text-primary',
      LOW: 'text-secondary',
    };
    return classes[priority] ?? 'text-on-surface-variant';
  }

  formatAnnouncementDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  canMoveAnnouncement(ann: Announcement): boolean {
    if (!this.canCreateAnnouncement()) return false;
    const role = this.auth.currentUser()?.roleName;
    if (role === 'ADMIN') return true;
    return ann.userId === this.currentUserId();
  }

  getConnectedLists(currentPriority: string): string[] {
    return ['LOW', 'NORMAL', 'HIGH', 'URGENT'].filter(p => p !== currentPriority);
  }

  onDrop(event: CdkDragDrop<Announcement[]>, targetPriority: string) {
    const ann = event.item.data as Announcement;

    if (event.previousContainer === event.container) {
      return;
    }

    if (!this.canMoveAnnouncement(ann)) return;

    const newPriority = targetPriority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    const currentAnnouncements = this.wsService.announcements();
    const updatedAnn = { ...ann, priority: newPriority };
    const newAnnouncements = currentAnnouncements.map(a => a.id === ann.id ? updatedAnn : a);
    this.wsService.announcements.set(newAnnouncements);

    this.updateAnnouncementPriority(ann.id, newPriority);
  }

  private updateAnnouncementPriority(id: number, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') {
    this.messagesService.updateAnnouncement(id, { priority }).subscribe({
      error: (err) => {
        this.alert.error(err.error?.message ?? 'Error updating priority');
      },
    });
  }
}
