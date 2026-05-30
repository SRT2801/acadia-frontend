import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
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
export class MainLayoutComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  private routerSub?: Subscription;

  isSidebarOpen = signal(false);
  isInCourse = signal(false);

  navItems = MAIN_NAV_ITEMS;

  displayName = this.auth.displayName;
  initials = this.auth.initials;
  displayRole = this.auth.displayRole;

  ngOnInit() {
    this.updateInCourse();
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateInCourse();
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private updateInCourse() {
    this.isInCourse.set(/^\/app\/courses\/\d+/.test(this.router.url));
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }
}
