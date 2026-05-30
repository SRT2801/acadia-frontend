import { Component, inject, computed } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  template: `
    @if (count() > 0) {
      <span
        class="absolute -top-xs -right-xs bg-error text-on-error rounded-full min-w-sz-4 h-sz-4 flex items-center justify-center text-label-xs px-xs"
        [attr.data-count]="count() > 99 ? '99+' : count()"
      >
        {{ count() > 99 ? '99+' : count() }}
      </span>
    }
  `,
})
export class NotificationBadgeComponent {
  private notificationService = inject(NotificationService);
  private wsService = inject(WebSocketService);

  count = computed(() => {
    const activeChannelId = (this.wsService as any).activeChannelId?.();

    const unread = this.notificationService.notifications().filter((n) => {
      if (!n.isRead && n.channelId === activeChannelId) {
        return false;
      }
      return !n.isRead;
    }).length;

    return unread > 0 ? unread : 0;
  });
}