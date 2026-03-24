import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 402) {
        // Plan limit reached — redirect to pricing page
        router.navigate(['/pricing'], { queryParams: { reason: error.error?.limit ?? 'limit' } });
        return throwError(() => error);
      }

      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        // Try to refresh token once
        return authService.refresh().pipe(
          switchMap(res => {
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
            return next(retryReq);
          }),
          catchError(() => {
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
