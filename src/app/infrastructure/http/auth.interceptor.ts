import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionRefreshService } from '../../application/auth/session-refresh.service';
import { SessionService } from '../../application/auth/session.service';
import { NotificationService } from '../../application/shared/notification.service';
import { AuthStorageService } from '../storage/auth-storage.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Credentials and access tokens belong only to our API.
  if (req.url !== environment.apiUrl && !req.url.startsWith(environment.apiUrl + '/'))
    return next(req);
  const storage = inject(AuthStorageService);
  const session = inject(SessionService);
  const refresh = inject(SessionRefreshService);
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const token = storage.getAccessToken();
  const authReq = req.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: 'Bearer ' + token } : {},
  });
  const isPublicAuth = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh-token',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/revoke-token',
  ].some((endpoint) => req.url.split('?')[0].endsWith(endpoint));

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isPublicAuth) return throwError(() => error);
      const currentToken = storage.getAccessToken();
      // A late 401 may belong to the token already replaced by another request.
      if (currentToken && currentToken !== token) {
        return next(authReq.clone({ setHeaders: { Authorization: 'Bearer ' + currentToken } }));
      }
      return refresh
        .refresh(() => {
          session.clear();
          void router.navigate(['/login']);
          notifications.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        })
        .pipe(
          switchMap((response) =>
            next(
              authReq.clone({
                setHeaders: { Authorization: 'Bearer ' + response.tokens.accessToken },
              }),
            ),
          ),
        );
    }),
  );
};
