import { Injectable, inject } from '@angular/core';
import { LoggerService } from '../utils/logger.service';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private notificationAudio: HTMLAudioElement | null = null;
  private sendAudio: HTMLAudioElement | null = null;
  private logger = inject(LoggerService);

  constructor() {
    this.initNotificationAudio();
    this.initSendAudio();
  }

  private initNotificationAudio(): void {
    try {
      this.notificationAudio = new Audio();
      this.notificationAudio.src = '/assets/sounds/MessageNotificacion.mp3';
      this.notificationAudio.volume = 0.5;
      this.notificationAudio.preload = 'auto';

      this.notificationAudio.onerror = (e) => {
        this.logger.error('Notification audio loading error', e);
      };

      this.notificationAudio.load();
    } catch (e) {
      this.logger.error('Error initializing notification audio', e);
    }
  }

  private initSendAudio(): void {
    try {
      this.sendAudio = new Audio();
      this.sendAudio.src = '/assets/sounds/SendMessage.mp3';
      this.sendAudio.volume = 0.1;
      this.sendAudio.preload = 'auto';

      this.sendAudio.onerror = (e) => {
        this.logger.error('Send audio loading error', e);
      };

      this.sendAudio.load();
    } catch (e) {
      this.logger.error('Error initializing send audio', e);
    }
  }

  async playNotificationSound(): Promise<void> {
    try {
      if (this.notificationAudio) {
        this.notificationAudio.currentTime = 0;
        await this.notificationAudio.play().catch(() => {});
      }
    } catch (e) {
      this.logger.warn('Error playing notification sound');
    }
  }

  async playSendSound(): Promise<void> {
    try {
      if (this.sendAudio) {
        this.sendAudio.currentTime = 0;
        await this.sendAudio.play().catch(() => {});
      }
    } catch (e) {
      this.logger.warn('Error playing send sound');
    }
  }

  async playMessageSound(): Promise<void> {
    await this.playNotificationSound();
  }
}
