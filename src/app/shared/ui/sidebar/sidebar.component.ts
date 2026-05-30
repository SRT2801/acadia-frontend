import { Component, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RefreshStateService } from '../../services/refresh-state.service';
import { LogoComponent } from '../logo/logo.component';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private refreshState = inject(RefreshStateService);

  isOpen = model(false);
  navItems = input<NavItem[]>([]);

  displayName = this.auth.displayName;
  initials = this.auth.initials;
  displayRole = this.auth.displayRole;
  userEmail = this.auth.userEmail;

  logout() {
    this.refreshState.reset();
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
