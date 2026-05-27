import { Component, computed, effect, HostListener, input, output, signal, untracked } from '@angular/core';

const MAX_WIDTHS: Record<string, string> = {
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
};

const ANIMATION_DURATION = 200;

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  isOpen = input(false);
  title = input('');
  maxWidth = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  close = output<void>();

  panelMaxWidth = computed(() => MAX_WIDTHS[this.maxWidth()] ?? MAX_WIDTHS['md']);
  closing = signal(false);
  visible = signal(false);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          this.closing.set(false);
          this.visible.set(true);
        } else if (this.visible()) {
          this.closing.set(true);
          setTimeout(() => {
            this.closing.set(false);
            this.visible.set(false);
          }, ANIMATION_DURATION);
        }
      });
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen() && !this.closing()) {
      this.closeWithAnimation();
    }
  }

  onBackdropClick() {
    if (!this.closing()) {
      this.closeWithAnimation();
    }
  }

  closeWithAnimation() {
    this.closing.set(true);
    setTimeout(() => {
      this.closing.set(false);
      this.close.emit();
    }, ANIMATION_DURATION);
  }
}
