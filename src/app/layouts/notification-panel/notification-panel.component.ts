import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../shared/services/notification.service';
import { NotificationBadgeComponent } from '../../shared/ui/notification-badge/notification-badge.component';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [NotificationBadgeComponent],
  template: `
    <div class="relative">
      <button
        (click)="toggle()"
        class="relative p-sm rounded-md hover:bg-surface-variant-hover transition-colors"
        aria-label="Notificaciones"
      >
        <span class="material-symbols-outlined text-on-surface">notifications</span>
        <app-notification-badge />
      </button>

      @if (isOpen()) {
        <div
          class="absolute right-0 top-full mt-sm w-80 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50"
          (click)="$event.stopPropagation()"
        >
          <div class="px-md py-sm border-b border-outline-variant flex justify-between items-center">
            <h3 class="text-label-md text-on-surface">Notificaciones</h3>
            @if (hasUnread()) {
              <button
                (click)="markAllAsRead()"
                class="text-body-xs text-primary hover:text-primary-hover"
              >
                Marcar todas como leídas
              </button>
            }
          </div>

          <div class="max-h-96 overflow-y-auto">
            @if (notifications().length === 0) {
              <div class="py-xl px-md text-center">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-sm">notifications_off</span>
                <p class="text-body-sm text-on-surface-variant">No hay notificaciones</p>
              </div>
            }

            @for (notification of notifications(); track notification.id) {
              <button
                (click)="onNotificationClick(notification)"
                class="w-full px-md py-sm flex items-start gap-sm hover:bg-surface-variant transition-colors text-left border-b border-outline-variant/50 last:border-b-0"
                [class.bg-surface-variant/30]="!notification.isRead"
              >
                <span class="material-symbols-outlined text-on-surface-variant mt-xxs">
                  {{ getIcon(notification.type) }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-body-sm text-on-surface font-medium truncate">
                    {{ notification.title }}
                  </p>
                  <p class="text-body-xs text-on-surface-variant truncate">
                    {{ notification.body }}
                  </p>
                  <p class="text-body-xs text-on-surface-variant/60 mt-xxs">
                    {{ formatTime(notification.createdAt) }}
                  </p>
                </div>
                @if (!notification.isRead) {
                  <span class="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-xxs"></span>
                }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationPanelComponent {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal(false);
  notifications = this.notificationService.notifications;
  hasUnread = () => this.notificationService.unreadCount() > 0;

  toggle() {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.notificationService.loadNotifications().subscribe();
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  onNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
      this.isOpen.set(false);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'MESSAGE':
        return 'chat';
      case 'ANNOUNCEMENT':
        return 'campaign';
      case 'MENTION':
        return 'alternate_email';
      case 'INVITATION':
        return 'mail';
      default:
        return 'notifications';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}