import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div [class]="variant() + '-skeleton'" [style.width]="width()" [style.height]="height()"></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #1c1b1b 25%, #2a2a2a 50%, #1c1b1b 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 0.25rem;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .text { height: 14px; }
    .title { height: 20px; }
    .avatar { width: 40px; height: 40px; border-radius: 9999px; }
    .button { height: 36px; border-radius: 0.5rem; }
    .card { height: 120px; border-radius: 0.75rem; }
    .line { height: 1px; }
  `]
})
export class SkeletonComponent {
  variant = input<'text' | 'title' | 'avatar' | 'button' | 'card' | 'line'>('text');
  width = input<string>('100%');
  height = input<string>('');
}