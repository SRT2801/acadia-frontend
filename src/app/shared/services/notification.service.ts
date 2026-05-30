import { Injectable, inject, signal, OnDestroy, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';
import { environment } from '../../../environments/environment';
import { SoundService } from './sound.service';

export interface Notification {
  id: number;
  type: 'MESSAGE' | 'ANNOUNCEMENT' | 'MENTION' | 'INVITATION';
  title: string;
  body: string;
  link?: string;
  userId: number;
  senderId?: number;
  senderName?: string;
  channelId?: number;
  channelName?: string;
  courseId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private injector = inject(Injector);

  private soundService: SoundService | null = null;

  private readonly apiUrl = environment.apiUrl;

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly toasts = signal<Notification[]>([]);

  private toastTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    this.setupWebSocketListener();
  }

  private getSoundService(): SoundService {
    if (!this.soundService) {
      this.soundService = this.injector.get(SoundService);
    }
    return this.soundService;
  }

  private setupWebSocketListener() {
    let attempts = 0;
    const maxAttempts = 50;

    const checkSocket = () => {
      const socket = (this.wsService as any).socket;
      if (socket && socket.connected) {
        console.log('[NotificationService] Socket connected, listening for notifications');
        socket.on('notification:created', (notification: Notification) => {
          console.log('[NotificationService] New notification received:', notification);
          this.handleNotification(notification);
        });
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkSocket, 100);
      } else {
        console.log('[NotificationService] Could not connect to socket after', maxAttempts, 'attempts');
      }
    };
    checkSocket();
  }

  private handleNotification(notification: Notification) {
    const activeChannelId = (this.wsService as any).activeChannelId?.();
    const isUserInChannel = notification.channelId === activeChannelId;
    const isFromCurrentUser = notification.senderId === (this.wsService as any).auth?.currentUser?.()?.userId;

    if (isUserInChannel || isFromCurrentUser) {
      console.log('[NotificationService] Skipping notification UI - user is in channel or is sender');
      return;
    }

    this.addNotification(notification);
    this.showToast(notification);

    const soundService = this.getSoundService();
    if (soundService) {
      soundService.playMessageSound();
    } else {
      console.log('[NotificationService] Sound service not available');
    }
  }

  private addNotification(notification: Notification) {
    this.notifications.update((notifications) => [
      notification,
      ...notifications,
    ]);
    this.unreadCount.update((count) => count + 1);
  }

  private showToast(notification: Notification) {
    this.toasts.update((toasts) => [...toasts, notification]);

    const timeout = setTimeout(() => {
      this.dismissToast(notification.id);
    }, 4000);

    this.toastTimeouts.set(notification.id, timeout);
  }

  dismissToast(notificationId: number) {
    const timeout = this.toastTimeouts.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(notificationId);
    }
    this.toasts.update((toasts) =>
      toasts.filter((t) => t.id !== notificationId),
    );
  }

  loadNotifications() {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`).pipe(
      tap((notifications: Notification[]) => {
        this.notifications.set(notifications);
        this.updateUnreadCount();
      }),
    );
  }

  loadUnreadCount() {
    return this.http
      .get<{ count: number }>(`${this.apiUrl}/notifications/unread-count`)
      .pipe(
        tap((res: { count: number }) => {
          this.unreadCount.set(res.count);
        }),
      );
  }

  markAsRead(notificationId: number) {
    return this.http
      .patch(`${this.apiUrl}/notifications/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          this.notifications.update((notifications) =>
            notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
          );
          this.updateUnreadCount();
        }),
      );
  }

  markAllAsRead() {
    return this.http.patch(`${this.apiUrl}/notifications/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update((notifications) =>
          notifications.map((n) => ({ ...n, isRead: true })),
        );
        this.unreadCount.set(0);
      }),
    );
  }

  markChannelAsRead(channelId: number) {
    return this.http
      .patch(`${this.apiUrl}/notifications/channel/${channelId}/read`, {})
      .pipe(
        tap(() => {
          this.notifications.update((notifications) =>
            notifications.map((n) =>
              n.channelId === channelId ? { ...n, isRead: true } : n,
            ),
          );
          this.updateUnreadCount();
        }),
      );
  }

  private updateUnreadCount() {
    const unread = this.notifications().filter((n) => !n.isRead).length;
    this.unreadCount.set(unread);
  }

  clearToasts() {
    this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.toastTimeouts.clear();
    this.toasts.set([]);
  }

  ngOnDestroy() {
    this.clearToasts();
  }
}