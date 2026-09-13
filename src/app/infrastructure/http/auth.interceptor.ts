import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../../presentation/state/auth.store';
import { toast } from 'ngx-sonner';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  const injector = inject(Injector);

  const token = storageService.getAccessToken();
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      if (error.status === 401 && !isAuthEndpoint) {
        const hadToken = !!storageService.getAccessToken();

        try {
          const authStore = injector.get(AuthStore);
          authStore.clearSession();
        } catch {
          storageService.clear();
          router.navigate(['/login']);
        }

        if (hadToken) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        }
      }
      return throwError(() => error);
    }),
  );
};
