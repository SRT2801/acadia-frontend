import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideSpinnerConfig } from 'ngx-spinner';
import { catchError, of, tap } from 'rxjs';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { AuthService } from './shared/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideSpinnerConfig({ type: 'ball-scale-multiple' }),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () =>
        auth.me().pipe(
          tap((user) => auth.currentUser.set(user)),
          catchError(() => of(null)),
        ).toPromise(),
      deps: [AuthService],
      multi: true,
    },
  ]
};
