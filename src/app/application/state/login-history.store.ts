import { inject, Injectable, signal } from '@angular/core';
import { merge, Subject } from 'rxjs';
import { LoginHistory } from '../../domain/models/user.model';
import { AuthStore } from './auth.store';
import { GetMyLoginHistoryUseCase } from '../security/get-my-login-history.use-case';
import { StoreRequestRunner } from './store-request.util';

/** Provided by the login-history component; its requests live with that component. */
@Injectable()
export class LoginHistoryStore {
  private readonly getHistory = inject(GetMyLoginHistoryUseCase);
  private readonly requests = inject(StoreRequestRunner);
  private readonly authStore = inject(AuthStore);
  private readonly cancel$ = new Subject<void>();
  private readonly items = signal<LoginHistory[]>([]);
  private readonly loading = signal(false);
  private readonly error = signal(false);

  readonly histories = this.items.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly hasError = this.error.asReadonly();

  load(): void {
    this.cancel$.next();
    this.error.set(false);
    this.requests.run({
      loading: this.loading,
      request$: this.getHistory.execute(),
      cancel$: merge(this.cancel$, this.authStore.ended$),
      fallbackErrorMessage: 'Không thể tải lịch sử đăng nhập',
      toastOnError: false,
      onSuccess: (items) => this.items.set(items),
      onError: () => this.error.set(true),
    });
  }

  ngOnDestroy(): void {
    this.cancel$.next();
  }
}
