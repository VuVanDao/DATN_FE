import { signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PagedResult } from '../../shared/models/paged-result.model';
import { StoreRequestRunner } from './store-request.util';

// Owned by a feature slice so cached pages survive tab component changes.
export class PagedListState<T> {
  private readonly cancel$ = new Subject<void>();
  private readonly itemsState = signal<T[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly totalState = signal(0);
  private readonly hasMoreState = signal(false);
  private pageIndex = 0;
  readonly items = this.itemsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loaded = this.loadedState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly totalCount = this.totalState.asReadonly();
  readonly hasMore = this.hasMoreState.asReadonly();

  constructor(
    private readonly runner: StoreRequestRunner,
    private readonly fetch: (id: string, page: number) => Observable<PagedResult<T>>,
  ) {}

  load(id: string, more = false): void {
    if (this.loading() || (!more && this.loaded()) || (more && !this.hasMore())) return;
    this.errorState.set(null);
    const page = more ? this.pageIndex + 1 : 1;
    this.runner.run({
      loading: this.loadingState,
      request$: this.fetch(id, page),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách. Vui lòng thử lại.',
      toastOnError: false,
      onSuccess: (result) => {
        this.itemsState.update((items) => (more ? [...items, ...result.items] : result.items));
        this.totalState.set(result.totalCount);
        this.hasMoreState.set(result.hasNextPage);
        this.pageIndex = result.pageIndex;
        this.loadedState.set(true);
      },
      onError: (message) => this.errorState.set(message),
    });
  }

  clear(): void {
    this.cancel$.next();
    this.itemsState.set([]);
    this.loadedState.set(false);
    this.errorState.set(null);
    this.totalState.set(0);
    this.hasMoreState.set(false);
    this.pageIndex = 0;
  }
}
