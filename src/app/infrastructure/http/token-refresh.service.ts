import { inject, Injectable } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, tap, throwError } from 'rxjs';
import { LoginResponse } from '../../domain/models/auth.model';
import { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case';
import { AuthStorageService } from '../storage/auth-storage.service';

/**
 * Manages deduplicated token refresh observable across concurrent HTTP 401s and startup.
 * Owned strictly by Infrastructure HTTP.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly refreshTokenUseCase = inject(RefreshTokenUseCase);
  private readonly storage = inject(AuthStorageService);
  private pending$: Observable<LoginResponse> | null = null;

  refresh(onFailure?: () => void): Observable<LoginResponse> {
    if (!this.pending$) {
      this.pending$ = this.refreshTokenUseCase
        .execute()
        .pipe(
          tap((response) => {
            this.storage.setAccessToken(response.tokens.accessToken);
            this.storage.setUser(response.user);
          }),
          catchError((error: unknown) => {
            onFailure?.();
            return throwError(() => error);
          }),
          finalize(() => {
            this.pending$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.pending$;
  }
}
