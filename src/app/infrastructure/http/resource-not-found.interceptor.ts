import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ResourceNotFoundFallbackService } from '../../application/shared/resource-not-found-fallback.service';

export const ResourceNotFoundInterceptor: HttpInterceptorFn = (req, next) => {
  const fallbackService = inject(ResourceNotFoundFallbackService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        const handled = fallbackService.handle(error, req);
        if (handled) {
          (error as unknown as Record<string, unknown>)['_handledNotFound'] = true;
        }
      }
      return throwError(() => error);
    }),
  );
};
