import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { CoursesService, Channel } from '../../../shared/services/courses.service';

@Component({
  selector: 'app-channel-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-content.component.html',
})
export class ChannelContentComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private coursesService = inject(CoursesService);

  channel = signal<Channel | null>(null);
  loading = signal(true);

  private paramSub?: Subscription;

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
          this.loadChannel(courseId, channelIndex);
        } else {
          this.loading.set(false);
        }
      },
    );
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
  }

  private loadChannel(courseId: number, channelIndex: number) {
    this.coursesService.getChannels(courseId).subscribe({
      next: (res) => {
        const items = res.channels?.items ?? [];
        if (channelIndex >= 0 && channelIndex < items.length) {
          this.channel.set(items[channelIndex]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
