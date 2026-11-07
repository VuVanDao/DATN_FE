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
    config.loading.set(true); // bat trang thai loading khi request bat dau
    const request$ = config.cancel$
      ? config.request$.pipe(takeUntil(config.cancel$))
      : config.request$;
    return request$
      .pipe(
        catchError((error: unknown) => {
          const isHandled = !!(error as Record<string, unknown>)?.[
            '_handledNotFound'
          ];
          const message = extractApiErrorMessage(error, config.fallbackErrorMessage); // trích xuất thông điệp lỗi dễ đọc từ đối tượng lỗi server trả về.
          if (!isHandled && config.toastOnError !== false) {
            this.notifications.error(message);
          }
          if (config.onError) {
            config.onError(message); // Nếu nơi gọi có truyền vào hàm xử lý lỗi riêng thì chạy hàm đó.
          }
          return EMPTY;
        }),
        finalize(() => config.loading.set(false)),
      )
      .subscribe((result) => {
        if (config.onSuccess) {
          config.onSuccess(result); // Nếu nơi gọi có truyền vào hàm xử lý thành công riêng thì chạy hàm đó.
        }
      });
  }
}
