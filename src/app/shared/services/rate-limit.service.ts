import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RateLimitService {
  private attempts = new Map<string, { count: number; resetAt: number }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 60000;

  isBlocked(key: string): boolean {
    const attempt = this.attempts.get(key);
    if (!attempt) return false;
    if (Date.now() > attempt.resetAt) {
      this.attempts.delete(key);
      return false;
    }
    return attempt.count >= this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const attempt = this.attempts.get(key);
    if (!attempt) {
      this.attempts.set(key, { count: 1, resetAt: Date.now() + this.windowMs });
    } else {
      attempt.count++;
    }
  }

  getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    return Math.max(0, attempt.resetAt - Date.now());
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }
}
