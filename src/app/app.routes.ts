import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'feed',
        loadComponent: () => import('./feed/feed.component').then((m) => m.FeedComponent),
      },
      {
        path: 'my-courses',
        loadComponent: () => import('./shared/ui/empty-state/empty-state.component').then((m) => m.EmptyStateComponent),
      },
      {
        path: 'announcements',
        loadComponent: () => import('./shared/ui/empty-state/empty-state.component').then((m) => m.EmptyStateComponent),
      },
      {
        path: 'messages',
        loadComponent: () => import('./shared/ui/empty-state/empty-state.component').then((m) => m.EmptyStateComponent),
      },
      {
        path: 'library',
        loadComponent: () => import('./shared/ui/empty-state/empty-state.component').then((m) => m.EmptyStateComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./shared/ui/empty-state/empty-state.component').then((m) => m.EmptyStateComponent),
      },
      {
        path: '',
        redirectTo: 'feed',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
