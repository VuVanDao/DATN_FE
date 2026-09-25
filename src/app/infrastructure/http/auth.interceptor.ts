import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { TokenService } from '../storage/token.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthStore } from '../../presentation/state/auth.store';
import { toast } from 'ngx-sonner';

let refreshInFlight$: Observable<string> | null = null;

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
  _originalError: HttpErrorResponse,
) {
  const authRepo = injector.get(AuthRepository);

  if (!refreshInFlight$) {
    refreshInFlight$ = authRepo.RefreshToken().pipe(
      map((response) => {
        const newToken = response.tokens.accessToken;
        tokenService.setAccessToken(newToken);
        return newToken;
      }),
      catchError((refreshError) => {
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
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  return refreshInFlight$.pipe(
    switchMap((newToken) =>
      next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
          withCredentials: true,
        }),
      ),
    ),
  );
}

