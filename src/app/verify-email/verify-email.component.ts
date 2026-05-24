import { Component, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LogoComponent } from '../shared/ui/logo/logo.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { CardHeaderComponent } from '../shared/ui/card-header/card-header.component';
import { CardContentComponent } from '../shared/ui/card-content/card-content.component';
import { AuthService } from '../shared/services/auth.service';
import { SpinnerService } from '../shared/services/spinner.service';
import { AlertService } from '../shared/services/alert.service';

export type VerificationState = 'no-token' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LogoComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
  ],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private spinner = inject(SpinnerService);
  private alert = inject(AlertService);

  state = signal<VerificationState>('no-token');
  errorMessage = signal('');

  constructor() {
    afterNextRender(() => {
      const token = this.route.snapshot.queryParamMap.get('token');

      if (!token) {
        return;
      }

      this.state.set('loading');
      this.spinner.show();

      this.authService.verifyEmail({ token }).subscribe({
      next: () => {
        this.spinner.hide();
        this.state.set('success');
        this.alert.success('Your email has been verified successfully.');
      },
      error: (err) => {
        this.spinner.hide();
        this.state.set('error');
        const msg = err.error?.details?.message ?? 'Invalid or expired verification token';
        this.errorMessage.set(msg);
        this.alert.error(msg);
      },
      });
    });
  }
}
