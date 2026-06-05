import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'button[ui-button], a[ui-button]',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  host: {
    '[class]': 'computedClasses()'
  }
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  fullWidth = input<boolean>(false);

  computedClasses = computed(() => {
    const base = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    const size = 'h-10 px-4 py-2 text-body-base rounded-lg';
    const variants = {
      primary: 'bg-primary-container text-on-primary-container hover:bg-surface-tint border border-transparent',
      secondary: 'bg-transparent text-on-surface border border-outline-variant hover:bg-surface-container-high',
      ghost: 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
    };
    const widthClass = this.fullWidth() ? 'w-full' : '';
    return `${base} ${size} ${variants[this.variant()]} ${widthClass}`;
  });
}
