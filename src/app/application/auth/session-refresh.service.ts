import { inject, Injectable, Injector } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, takeUntil, tap, throwError } from 'rxjs';
import { LoginResponse } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { SessionService } from './session.service';

/** One refresh per application injector, shared by startup and concurrent 401s. */
@Injectable({ providedIn: 'root' })
export class SessionRefreshService {
  private readonly injector = inject(Injector);
  private readonly session = inject(SessionService);
  private pending$: Observable<LoginResponse> | null = null;

  refresh(onFailure?: () => void): Observable<LoginResponse> {
    if (!this.pending$) {
      this.pending$ = this.injector
        .get(AuthRepository)
        .refreshToken()
        .pipe(
          takeUntil(this.session.ended$),
          tap((response) => this.session.establish(response)),
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
