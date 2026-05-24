import { Component, input, output, signal, computed, effect, HostBinding, HostListener } from '@angular/core';

export interface AutocompleteOption {
  value: number | string;
  label: string;
  subtitle?: string;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.css',
})
export class AutocompleteComponent {
  options = input<AutocompleteOption[]>([]);
  placeholder = input('Search...');
  hasError = input<boolean>(false);
  disabled = input<boolean>(false);

  valueChange = output<AutocompleteOption | null>();

  query = signal('');
  isOpen = signal(false);
  selectedOption = signal<AutocompleteOption | null>(null);
  activeIndex = signal(-1);

  filteredOptions = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.options();
    return this.options().filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)),
    );
  });

  @HostBinding('class') hostClass = 'block relative';

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('app-autocomplete')) {
      this.isOpen.set(false);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const max = this.filteredOptions().length - 1;
      this.activeIndex.update((i) => (i < max ? i + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const max = this.filteredOptions().length - 1;
      this.activeIndex.update((i) => (i > 0 ? i - 1 : max));
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      const active = this.filteredOptions()[this.activeIndex()];
      if (active) {
        this.selectOption(active);
      }
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  selectOption(option: AutocompleteOption) {
    this.selectedOption.set(option);
    this.query.set(option.label);
    this.isOpen.set(false);
    this.activeIndex.set(-1);
    this.valueChange.emit(option);
  }

  clear() {
    this.selectedOption.set(null);
    this.query.set('');
    this.valueChange.emit(null);
  }

  onInputFocus() {
    if (!this.disabled()) {
      this.isOpen.set(true);
    }
  }

  onInputInput(value: string) {
    this.query.set(value);
    this.selectedOption.set(null);
    this.isOpen.set(true);
    this.activeIndex.set(-1);
    this.valueChange.emit(null);
  }
}
