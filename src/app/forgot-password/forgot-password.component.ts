import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { InputDirective } from '../shared/ui/input/input.directive';
import { CardComponent } from '../shared/ui/card/card.component';
import { CardHeaderComponent } from '../shared/ui/card-header/card-header.component';
import { CardContentComponent } from '../shared/ui/card-content/card-content.component';
import { LogoComponent } from '../shared/ui/logo/logo.component';
import { AuthService } from '../shared/services/auth.service';
import { SpinnerService } from '../shared/services/spinner.service';
import { AlertService } from '../shared/services/alert.service';

export type ForgotPasswordState = 'form' | 'success';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private spinner = inject(SpinnerService);
  private alert = inject(AlertService);

  forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isSubmitting = signal(false);
  state = signal<ForgotPasswordState>('form');

  isFieldInvalid(field: 'email'): boolean {
    const control = this.forgotForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.isSubmitting.set(true);
      this.spinner.show();

      const { email } = this.forgotForm.getRawValue();

      this.authService.forgotPassword({ email }).subscribe({
        next: () => {
          this.spinner.hide();
          this.isSubmitting.set(false);
          this.state.set('success');
        },
        error: (err) => {
          this.spinner.hide();
          this.isSubmitting.set(false);
          this.alert.error(
            err.error?.details?.message ?? 'Something went wrong. Please try again.',
          );
        },
      });
    } else {
      this.forgotForm.markAllAsTouched();
    }
  }
}
