import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { toast } from 'ngx-sonner';
import { extractApiErrorMessage } from '../../shared/utils/api-error.util';

export interface StoreRequestConfig<T> {
  loading: WritableSignal<boolean>;
  request$: Observable<T>;
  fallbackErrorMessage: string;
  onSuccess?: (result: T) => void;
  onError?: (message: string) => void;
  toastOnError?: boolean;
}

/**
 * Chuẩn hoá vòng đời của một request trong store: bật/tắt loading, trích message lỗi
 * từ API, hiển thị toast và gọi callback của caller.
 */
export function runStoreRequest<T>(config: StoreRequestConfig<T>): void {
  const {
    loading,
    request$,
    fallbackErrorMessage,
    onSuccess,
    onError,
    toastOnError = true,
  } = config;

  loading.set(true);

  request$.subscribe({
    next: (result) => {
      loading.set(false);
      onSuccess?.(result);
      /**onSuccess?.(result);
      * là viết tắt của
       * if (onSuccess) {
             onSuccess(result);
          }
       */
    },
    error: (err) => {
      loading.set(false);
      const message = extractApiErrorMessage(err, fallbackErrorMessage);
      if (toastOnError) {
        toast.error(message);
      }
      onError?.(message);
    },
  });
}
