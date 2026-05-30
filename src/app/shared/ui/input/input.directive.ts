import { Directive, input, computed, inject, ElementRef } from '@angular/core';

@Directive({
  selector: 'input[ui-input], textarea[ui-input]',
  standalone: true,
  host: {
    '[class]': 'computedClasses()',
  },
})
export class InputDirective {
  private el = inject(ElementRef);
  hasError = input<boolean>(false);
  iconLeft = input<boolean>(false);
  iconRight = input<boolean>(false);

  computedClasses = computed(() => {
    const isTextarea = this.el.nativeElement.tagName.toLowerCase() === 'textarea';
    const base =
      'block w-full rounded-lg bg-surface-container-low border text-on-surface placeholder-on-surface-variant transition-colors duration-200 text-body-base focus:outline-none';
    const size = isTextarea ? 'py-2 px-3 min-h-[80px]' : 'h-10 px-3';
    const padding = `${this.iconLeft() ? '!pl-10' : ''} ${this.iconRight() ? '!pr-10' : ''}`.trim();
    const borders = this.hasError()
      ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
      : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary';

    return `${base} ${size} ${padding} ${borders}`;
  });
}
