import { Injectable, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../utils/logger.service';

export interface Message {
  id: number;
  content: string;
  channelId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channelId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private auth = inject(AuthService);
  private logger = inject(LoggerService);
  private socket: Socket | null = null;
  private globalConnectionActive = false;

  readonly connected = signal(false);
  readonly messages = signal<Message[]>([]);
  readonly announcements = signal<Announcement[]>([]);
  readonly activeChannelId = signal<number | null>(null);

  constructor() {
    this.connectGlobal();
  }

  private getJwtToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('wsToken');
  }

  connect() {
    if (this.socket?.connected) return;

    const token = this.getJwtToken();
    if (!token) {
      return;
    }

    this.socket = io(`${environment.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.connected.set(false);
    });

    this.socket.on('connect_error', (err) => {
      this.logger.error('WebSocket connection error', err.message);
    });

    this.socket.on('message:created', (message: Message) => {
      this.messages.update((msgs) => [...msgs, message]);
    });

    this.socket.on('message:updated', (message: Message) => {
      this.messages.update((msgs) =>
        msgs.map((m) => (m.id === message.id ? message : m)),
      );
    });

    this.socket.on('message:deleted', (data: { id: number }) => {
      this.messages.update((msgs) => msgs.filter((m) => m.id !== data.id));
    });

    this.socket.on('announcement:created', (announcement: Announcement) => {
      this.announcements.update((anns) => [announcement, ...anns]);
    });

    this.socket.on('announcement:updated', (announcement: Announcement) => {
      this.announcements.update((anns) =>
        anns.map((a) => (a.id === announcement.id ? announcement : a)),
      );
    });

    this.socket.on('announcement:deleted', (data: { id: number }) => {
      this.announcements.update((anns) =>
        anns.filter((a) => a.id !== data.id),
      );
    });

    this.socket.on('announcement:pinned', (announcement: Announcement) => {
      this.announcements.update((anns) =>
        anns.map((a) => (a.id === announcement.id ? announcement : a)),
      );
    });

    this.socket.on('notification:created', (notification: unknown) => {
      this.logger.debug('Notification received via WebSocket');
    });
  }

  connectGlobal() {
    if (this.globalConnectionActive) return;
    this.globalConnectionActive = true;

    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });

    this.connect();
  }

  disconnect() {
    if (this.activeChannelId()) {
      this.leaveChannel(this.activeChannelId()!);
    }
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  joinChannel(channelId: number) {
    if (this.activeChannelId()) {
      this.leaveChannel(this.activeChannelId()!);
    }
    this.socket?.emit('joinChannel', { channelId });
    this.activeChannelId.set(channelId);
    this.messages.set([]);
  }

  leaveChannel(channelId: number) {
    this.socket?.emit('leaveChannel', { channelId });
    if (this.activeChannelId() === channelId) {
      this.activeChannelId.set(null);
      this.messages.set([]);
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
