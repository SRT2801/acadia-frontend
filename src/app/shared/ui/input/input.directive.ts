import { Directive, input, computed } from '@angular/core';

@Directive({
  selector: 'input[ui-input], textarea[ui-input]',
  standalone: true,
  host: {
    '[class]': 'computedClasses()'
  }
})
export class InputDirective {
  hasError = input<boolean>(false);
  iconLeft = input<boolean>(false);
  iconRight = input<boolean>(false);

  computedClasses = computed(() => {
    const base = 'block w-full rounded-lg bg-surface-container-low border text-on-surface placeholder-on-surface-variant transition-colors duration-200 text-body-base focus:outline-none';
    const size = 'h-10 px-3';
    const padding = `${this.iconLeft() ? '!pl-10' : ''} ${this.iconRight() ? '!pr-10' : ''}`.trim();
    const borders = this.hasError()
      ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
      : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary';

    return `${base} ${size} ${padding} ${borders}`;
  });
}
