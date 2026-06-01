import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LogoComponent } from '../shared/ui/logo/logo.component';
import { InputDirective } from '../shared/ui/input/input.directive';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { CardHeaderComponent } from '../shared/ui/card-header/card-header.component';
import { CardContentComponent } from '../shared/ui/card-content/card-content.component';
import { AuthService } from '../shared/services/auth.service';
import { AlertService } from '../shared/services/alert.service';
import { SpinnerService } from '../shared/services/spinner.service';
import { RateLimitService } from '../shared/services/rate-limit.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputDirective,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    LogoComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alert = inject(AlertService);
  private spinnerService = inject(SpinnerService);
  private rateLimit = inject(RateLimitService);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  showPassword = signal(false);
  isSubmitting = signal(false);

  togglePassword() {
    this.showPassword.update((val) => !val);
  }

  isFieldInvalid(field: 'email' | 'password'): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.rateLimit.isBlocked('login')) {
      const waitSeconds = Math.ceil(this.rateLimit.getRemainingTime('login') / 1000);
      this.alert.error(`Demasiados intentos. Esperá ${waitSeconds} segundos antes de intentar de nuevo.`);
      return;
    }

    this.isSubmitting.set(true);
    this.spinnerService.show();

    const { email, password } = this.loginForm.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.spinnerService.hide();
        this.rateLimit.clear('login');
        this.router.navigate(['/app/feed']);
      },
      error: (err) => {
        this.spinnerService.hide();
        this.isSubmitting.set(false);
        this.rateLimit.recordAttempt('login');
        const message = err.error?.message || 'Credenciales inválidas. Verificá tu email y contraseña.';
        this.alert.error(message);
      },
    });
  }
}
