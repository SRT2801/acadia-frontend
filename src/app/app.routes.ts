import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { createCourseGuard } from './shared/guards/create-course.guard';

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
        path: 'courses',
        loadComponent: () => import('./courses/course-list/course-list.component').then((m) => m.CourseListComponent),
      },
      {
        path: 'courses/new',
        canActivate: [createCourseGuard],
        loadComponent: () => import('./courses/course-form/course-form.component').then((m) => m.CourseFormComponent),
      },
      {
        path: 'courses/:id',
        loadComponent: () =>
          import('./courses/course-workspace/course-workspace.component').then(
            (m) => m.CourseWorkspaceComponent,
          ),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'channel/0',
          },
          {
            path: 'channel/:channelIndex',
            loadComponent: () =>
              import('./courses/course-workspace/channel-content/channel-content.component').then(
                (m) => m.ChannelContentComponent,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./courses/course-settings/course-settings.component').then(
                (m) => m.CourseSettingsComponent,
              ),
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./courses/course-members/course-members.component').then(
                (m) => m.CourseMembersComponent,
              ),
          },
        ],
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
