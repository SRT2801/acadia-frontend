import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30">construction</span>
        <p class="text-body-base text-on-surface-variant mt-sm">Coming soon</p>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {}
