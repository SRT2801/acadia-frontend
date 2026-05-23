import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { InputDirective } from '../shared/ui/input/input.directive';
import { CardComponent } from '../shared/ui/card/card.component';
import { CardHeaderComponent } from '../shared/ui/card-header/card-header.component';
import { CardContentComponent } from '../shared/ui/card-content/card-content.component';
import { LogoComponent } from '../shared/ui/logo/logo.component';
import { AuthService } from '../shared/services/auth.service';
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
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    LogoComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private spinner = inject(SpinnerService);
  private alert = inject(AlertService);

  registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    universityId: ['', [Validators.required]],
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

  togglePassword() {
    this.showPassword.update((val) => !val);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isSubmitting.set(true);
      const { universityId, ...rest } = this.registerForm.getRawValue();
      this.spinner.show();
      this.authService.register({ ...rest, universityId: Number(universityId) }).subscribe({
        next: () => {
          this.spinner.hide();
          this.isSubmitting.set(false);
          this.alert.success('Account created successfully! Check your email to verify your account.');
          this.router.navigate(['/verify-email']);
        },
        error: (err) => {
          this.spinner.hide();
          this.isSubmitting.set(false);
          this.alert.error(
            err.error?.details?.message ?? 'Registration failed. Please try again.',
          );
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
