import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Course, Channel, ChannelCategory } from '../../../shared/services/courses.service';

@Component({
  selector: 'app-course-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-sidebar.component.html',
})
export class CourseSidebarComponent {
  course = input<Course | null>();
  channels = input<Channel[]>([]);
  categories = input<ChannelCategory[]>([]);
  activeChannelIndex = input(0);
  memberCount = input(0);

  createChannel = output<void>();

  uncategorizedChannels = computed(() =>
    this.channels().filter((ch) => !ch.categoryId),
  );

  getChannelsInCategory(catId: number): Channel[] {
    return this.channels().filter((ch) => ch.categoryId === catId);
  }

  getChannelIndex(ch: Channel): number {
    return this.channels().findIndex((c) => c.id === ch.id);
  }

  isChannelActive(ch: Channel): boolean {
    return this.getChannelIndex(ch) === this.activeChannelIndex();
  }

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
}
