import { Component, inject } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  template: `
    <div class="fixed top-lg right-lg z-50 flex flex-col gap-md max-w-sz-80">
      @for (toast of toasts(); track toast.id) {
        <div
          class="bg-surface-variant border border-outline-variant rounded-lg p-md shadow-lg animate-slide-in-right"
          role="alert"
        >
          <div class="flex items-start gap-sm">
            <span class="material-symbols-outlined text-on-surface-variant mt-xxs">notifications</span>
            <div class="flex-1 min-w-0">
              <p class="text-label-sm text-on-surface font-semibold truncate">
                {{ toast.senderName || 'Nuevo mensaje' }}
              </p>
              <p class="text-body-sm text-on-surface-variant truncate">
                {{ toast.title }}
              </p>
              <p class="text-body-xs text-on-surface-variant/70 mt-xxs truncate">
                {{ toast.body }}
              </p>
            </div>
            <button
              (click)="dismiss(toast.id)"
              class="text-on-surface-variant hover:text-on-surface transition-colors p-xxs"
              aria-label="Cerrar"
            >
              <span class="material-symbols-outlined text-md">close</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in-right {
      animation: slideInRight 0.3s ease-out;
    }
  `],
})
export class NotificationToastComponent {
  private notificationService = inject(NotificationService);

  toasts = this.notificationService.toasts;

  dismiss(id: number) {
    this.notificationService.dismissToast(id);
  }
}