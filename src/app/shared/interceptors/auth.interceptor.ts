import {
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RefreshStateService } from '../services/refresh-state.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const refreshState = inject(RefreshStateService);

  const cloned = req.clone({ withCredentials: true });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      if (refreshState.isRefreshing) {
        return refreshState.waitForRefresh().pipe(
          switchMap((completed) => {
            if (!completed) {
              router.navigate(['/login']);
              return throwError(() => error);
            }
            return next(req.clone({ withCredentials: true }));
          }),
        );
      }

      refreshState.startRefresh();

      return http
        .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          timeout(5000),
          switchMap(() => {
            refreshState.completeRefresh();
            return next(req.clone({ withCredentials: true }));
          }),
          catchError((refreshError) => {
            refreshState.failRefresh();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
    }),
  );
};
