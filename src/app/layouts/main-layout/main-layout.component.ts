import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, type NavItem } from '../../shared/ui/sidebar/sidebar.component';
import { AuthService } from '../../shared/services/auth.service';

const MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'Feed', route: '/app/feed', icon: 'home', exact: true },
  { label: 'My courses', route: '/app/courses', icon: 'school' },
  { label: 'Announcements', route: '/app/announcements', icon: 'campaign' },
  { label: 'Messages', route: '/app/messages', icon: 'mail' },
  { label: 'Library', route: '/app/library', icon: 'description' },
  { label: 'Profile', route: '/app/profile', icon: 'person' },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private auth = inject(AuthService);

  isSidebarOpen = signal(false);

  navItems = MAIN_NAV_ITEMS;

  displayName = this.auth.displayName;
  initials = this.auth.initials;
  displayRole = this.auth.displayRole;

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }
}
