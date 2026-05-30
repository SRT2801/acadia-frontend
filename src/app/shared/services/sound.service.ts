import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private audio: HTMLAudioElement | null = null;
  private audioLoaded = false;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audio = new Audio();
      this.audio.src = '/assets/sounds/Voicy_Viber notification sound.mp3';
      this.audio.volume = 0.5;
      this.audio.preload = 'auto';

      this.audio.oncanplaythrough = () => {
        console.log('[SoundService] Audio ready to play');
        this.audioLoaded = true;
      };

      this.audio.onloadeddata = () => {
        console.log('[SoundService] Audio loaded');
        this.audioLoaded = true;
      };

      this.audio.onerror = (e) => {
        console.error('[SoundService] Audio error:', e);
      };

      this.audio.load();
    } catch (e) {
      console.error('[SoundService] Error initializing audio:', e);
    }
  }

  async playMessageSound(): Promise<void> {
    try {
      if (!this.audio) {
        this.initAudio();
      }

      if (this.audio) {
        this.audio.currentTime = 0;
        console.log('[SoundService] Playing sound, loaded:', this.audioLoaded);

        await this.audio.play().catch((e) => {
          console.warn('[SoundService] Play catch:', e);
        });
      }
    } catch (e: any) {
      console.warn('[SoundService] Error:', e.message);
    }
  }

  playNotificationSound() {
    this.playMessageSound();
  }
}