import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message, Announcement } from './websocket.service';

export interface CreateMessageDto {
  content: string;
  channelId: number;
}

export interface UpdateMessageDto {
  content: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  channelId: number;
  pinned?: boolean;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  pinned?: boolean;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMessages(channelId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/channel/${channelId}`);
  }

  createMessage(dto: CreateMessageDto): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, dto);
  }

  updateMessage(id: number, dto: UpdateMessageDto): Observable<Message> {
    return this.http.patch<Message>(`${this.apiUrl}/messages/${id}`, dto);
  }

  deleteMessage(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/messages/${id}`);
  }

  getAnnouncements(channelId: number): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/announcements/channel/${channelId}`);
  }

  createAnnouncement(dto: CreateAnnouncementDto): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/announcements`, dto);
  }

  updateAnnouncement(id: number, dto: UpdateAnnouncementDto): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.apiUrl}/announcements/${id}`, dto);
  }

  togglePinAnnouncement(id: number): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.apiUrl}/announcements/${id}/pin`, {});
  }

  deleteAnnouncement(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/announcements/${id}`);
  }
}
