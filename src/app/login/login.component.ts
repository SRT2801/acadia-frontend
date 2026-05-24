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

    this.isSubmitting.set(true);

    const { email, password } = this.loginForm.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate(['/app/feed']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const message = err.error?.message || 'Invalid credentials. Please check your email and password.';
        this.alert.error(message);
      },
    });
  }
}
