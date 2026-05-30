import { Component, signal, computed, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { InputDirective } from '../shared/ui/input/input.directive';
import { AutocompleteComponent, AutocompleteOption } from '../shared/ui/autocomplete/autocomplete.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { CardHeaderComponent } from '../shared/ui/card-header/card-header.component';
import { CardContentComponent } from '../shared/ui/card-content/card-content.component';
import { LogoComponent } from '../shared/ui/logo/logo.component';
import { AuthService } from '../shared/services/auth.service';
import { UniversitiesService, University } from '../shared/services/universities.service';
import { SpinnerService } from '../shared/services/spinner.service';
import { AlertService } from '../shared/services/alert.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    InputDirective,
    AutocompleteComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    LogoComponent,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private universitiesService = inject(UniversitiesService);
  private router = inject(Router);
  private spinner = inject(SpinnerService);
  private alert = inject(AlertService);

  universities = signal<University[]>([]);
  universityOptions = computed<AutocompleteOption[]>(() =>
    this.universities().map((u) => ({
      value: u.id,
      label: u.name,
      subtitle: u.city && u.country ? `${u.city}, ${u.country}` : undefined,
    })),
  );

  selectedUniversityId = signal<number | null>(null);
  showUniversityPicker = signal(false);
  universityError = signal('');

  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  showPassword = signal(false);
  isSubmitting = signal(false);

  passwordStrength = computed(() => {
    const val = this.registerForm.get('password')?.value ?? '';
    if (!val) return { label: 'None', level: 0 };
    let score = 0;
    if (val.length >= 8) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    if (score <= 1) return { label: 'Weak', level: 1 };
    if (score === 2) return { label: 'Fair', level: 2 };
    if (score === 3) return { label: 'Good', level: 3 };
    return { label: 'Strong', level: 4 };
  });

  strengthColors = ['', 'bg-error', 'bg-tertiary', 'bg-secondary', 'bg-primary'];

  detectedUniversity = computed(() => {
    const email = this.registerForm.get('email')?.value ?? '';
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    return this.universities().find((u) => u.domain === domain) ?? null;
  });

  constructor() {
    afterNextRender(() => {
      this.universitiesService.findAll().subscribe({
        next: (universities) => this.universities.set(universities),
      });
    });
  }

  togglePassword() {
    this.showPassword.update((val) => !val);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onUniversityChange(option: AutocompleteOption | null) {
    this.selectedUniversityId.set(option ? (option.value as number) : null);
    this.universityError.set('');
  }

  removeUniversity() {
    this.selectedUniversityId.set(null);
    this.universityError.set('');
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isSubmitting.set(true);
      this.spinner.show();

      const formValue = this.registerForm.getRawValue();
      const universityId = this.selectedUniversityId();

      this.authService.register({
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        ...(universityId ? { universityId } : {}),
      }).subscribe({
        next: () => {
          this.spinner.hide();
          this.isSubmitting.set(false);
          this.alert.success('Account created successfully! Check your email to verify your account.');
          this.router.navigate(['/verify-email']);
        },
        error: (err) => {
          this.spinner.hide();
          this.isSubmitting.set(false);

          const detailsMessage: string | undefined = err.error?.details?.message;
          const message: string | undefined = err.error?.message;

          if (
            detailsMessage?.toLowerCase().includes('universidad') ||
            message?.toLowerCase().includes('universidad')
          ) {
            this.showUniversityPicker.set(true);
            this.universityError.set(
              detailsMessage ?? message ?? 'Please select your university.',
            );
          } else {
            this.alert.error(
              detailsMessage ?? message ?? 'Registration failed. Please try again.',
            );
          }
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
