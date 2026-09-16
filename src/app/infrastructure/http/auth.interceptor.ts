import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { TokenService } from '../storage/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthStore } from '../../presentation/state/auth.store';
import { toast } from 'ngx-sonner';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const injector = inject(Injector);

  const token = tokenService.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    withCredentials: true,
    setHeaders: headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh-token');

      if (error.status === 401 && !isAuthEndpoint) {
        return handle401Error(req, next, tokenService, injector, router, error);
      }

      return throwError(() => error);
    }),
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenService: TokenService,
  injector: Injector,
  router: Router,
  originalError: HttpErrorResponse,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const authRepo = injector.get(AuthRepository);

    return authRepo.RefreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        const newToken = response.Tokens.AccessToken;
        tokenService.setAccessToken(newToken);
        refreshTokenSubject.next(newToken);

        return next(
          req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
            withCredentials: true,
          }),
        );
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        tokenService.clear();

        try {
          const authStore = injector.get(AuthStore);
          authStore.clearSession();
        } catch {
          router.navigate(['/login']);
        }

        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return throwError(() => refreshError);
      }),
    );
  } else {
    // Đang có một request khác thực hiện refresh token -> chờ token mới
    return refreshTokenSubject.pipe(
      filter((newToken): newToken is string => newToken !== null),
      take(1),
      switchMap((newToken) => {
        return next(
          req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
            withCredentials: true,
          }),
        );
      }),
    );
  }
}

