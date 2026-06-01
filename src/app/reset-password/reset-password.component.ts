import { Component, signal, inject, afterNextRender, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { InputDirective } from '../shared/ui/input/input.directive';
import { CardComponent } from '../shared/ui/card/card.component';
import { CardHeaderComponent } from '../shared/ui/card-header/card-header.component';
import { CardContentComponent } from '../shared/ui/card-content/card-content.component';
import { LogoComponent } from '../shared/ui/logo/logo.component';
import { AuthService } from '../shared/services/auth.service';
import { SpinnerService } from '../shared/services/spinner.service';
import { AlertService } from '../shared/services/alert.service';

export type ResetPasswordState = 'no-token' | 'form' | 'submitting' | 'success' | 'error';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private spinner = inject(SpinnerService);
  private alert = inject(AlertService);

  state = signal<ResetPasswordState>('no-token');
  errorMessage = signal('');
  token = signal('');

  resetForm = this.fb.nonNullable.group({
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(128),
      Validators.pattern(PASSWORD_PATTERN),
    ]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator });

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  passwordStrength = computed(() => {
    const val = this.resetForm.get('newPassword')?.value ?? '';
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

  toggleConfirmPassword() {
    this.showConfirmPassword.update((val) => !val);
  }

  isFieldInvalid(field: 'newPassword' | 'confirmPassword'): boolean {
    const control = this.resetForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get passwordsMismatch(): boolean {
    return !!this.resetForm.hasError('passwordsMismatch')
      && (this.resetForm.get('confirmPassword')?.dirty || this.resetForm.get('confirmPassword')?.touched === true);
  }

  constructor() {
    afterNextRender(() => {
      const token = this.route.snapshot.queryParamMap.get('token');

      if (!token) {
        this.state.set('no-token');
        return;
      }

      this.token.set(token);
      this.state.set('form');
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.state.set('submitting');
      this.spinner.show();

      const { newPassword } = this.resetForm.getRawValue();

      this.authService.resetPassword({ token: this.token(), newPassword }).subscribe({
        next: () => {
          this.spinner.hide();
          this.state.set('success');
          this.alert.success('Your password has been reset successfully.');
        },
        error: (err) => {
          this.spinner.hide();
          this.state.set('error');
          const msg = err.error?.details?.message ?? err.error?.message ?? 'Invalid or expired reset token';
          this.errorMessage.set(msg);
          this.alert.error(msg);
        },
      });
    } else {
      this.resetForm.markAllAsTouched();
    }
  }
}
