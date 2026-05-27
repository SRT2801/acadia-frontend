import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'verify-email',
    renderMode: RenderMode.Client
  },
  {
    path: 'auth/reset-password',
    renderMode: RenderMode.Client
  },
  {
    path: 'app/feed',
    renderMode: RenderMode.Client
  },
  {
    path: 'app/courses',
    renderMode: RenderMode.Client
  },
  {
    path: 'app/courses/new',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
