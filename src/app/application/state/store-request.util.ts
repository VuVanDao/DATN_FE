import { inject, Injectable, WritableSignal } from '@angular/core';
import { catchError, EMPTY, finalize, Observable, Subscription, takeUntil } from 'rxjs';
import { extractApiErrorMessage } from '../../shared/utils/api-error.util';
import { NotificationService } from '../shared/notification.service';

export interface StoreRequestConfig<T> {
  loading: WritableSignal<boolean>;
  request$: Observable<T>;
  cancel$?: Observable<unknown>;
  fallbackErrorMessage: string;
  onSuccess?: (result: T) => void;
  onError?: (message: string) => void;
  toastOnError?: boolean;
}

/** The caller owns cancellation; every termination path resets loading. */
@Injectable({ providedIn: 'root' })
export class StoreRequestRunner {
  private readonly notifications = inject(NotificationService);

  run<T>(config: StoreRequestConfig<T>): Subscription {
    config.loading.set(true);
    const request$ = config.cancel$
      ? config.request$.pipe(takeUntil(config.cancel$))
      : config.request$;
    return request$
      .pipe(
        catchError((error: unknown) => {
          const message = extractApiErrorMessage(error, config.fallbackErrorMessage);
          if (config.toastOnError !== false) this.notifications.error(message);
          config.onError?.(message);
          return EMPTY;
        }),
        finalize(() => config.loading.set(false)),
      )
      .subscribe((result) => config.onSuccess?.(result));
  }
}
