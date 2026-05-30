import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

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
  private socket: Socket | null = null;

  readonly connected = signal(false);
  readonly messages = signal<Message[]>([]);
  readonly announcements = signal<Announcement[]>([]);
  readonly activeChannelId = signal<number | null>(null);

  private getJwtToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('wsToken');
  }

  connect() {
    if (this.socket?.connected) return;

    const token = this.getJwtToken();
    console.log('[WS] Token found:', !!token);
    if (!token) {
      console.log('[WS] No token, cannot connect');
      return;
    }

    console.log('[WS] Connecting to', `${environment.apiUrl}/chat`);
    this.socket = io(`${environment.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected!');
      this.connected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      this.connected.set(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
    });

    this.socket.on('message:created', (message: Message) => {
      console.log('[WS] message:created received:', message);
      this.messages.update((msgs) => [...msgs, message]);
    });

    this.socket.on('message:updated', (message: Message) => {
      console.log('[WS] message:updated received:', message);
      this.messages.update((msgs) =>
        msgs.map((m) => (m.id === message.id ? message : m)),
      );
    });

    this.socket.on('message:deleted', (data: { id: number }) => {
      console.log('[WS] message:deleted received:', data);
      this.messages.update((msgs) => msgs.filter((m) => m.id !== data.id));
    });

    this.socket.on('announcement:created', (announcement: Announcement) => {
      console.log('[WS] announcement:created received:', announcement);
      this.announcements.update((anns) => [announcement, ...anns]);
    });

    this.socket.on('announcement:updated', (announcement: Announcement) => {
      console.log('[WS] announcement:updated received:', announcement);
      this.announcements.update((anns) =>
        anns.map((a) => (a.id === announcement.id ? announcement : a)),
      );
    });

    this.socket.on('announcement:deleted', (data: { id: number }) => {
      console.log('[WS] announcement:deleted received:', data);
      this.announcements.update((anns) =>
        anns.filter((a) => a.id !== data.id),
      );
    });

    this.socket.on('announcement:pinned', (announcement: Announcement) => {
      console.log('[WS] announcement:pinned received:', announcement);
      this.announcements.update((anns) =>
        anns.map((a) => (a.id === announcement.id ? announcement : a)),
      );
    });
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
    console.log('[WS] joinChannel called with:', channelId);
    console.log('[WS] Current socket connected:', this.socket?.connected);
    if (this.activeChannelId()) {
      this.leaveChannel(this.activeChannelId()!);
    }
    this.socket?.emit('joinChannel', { channelId });
    this.activeChannelId.set(channelId);
    this.messages.set([]);
    console.log('[WS] Joined channel:', channelId);
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
