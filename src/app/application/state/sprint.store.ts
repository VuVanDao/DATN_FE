import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ProjectBacklog } from '../../domain/models/sprint.model';
import { GetProjectBacklogUseCase } from '../sprint/get-project-backlog.use-case';
import { StoreRequestRunner } from './store-request.util';

@Injectable({ providedIn: 'root' })
export class SprintStore {
  private readonly getProjectBacklogUseCase = inject(GetProjectBacklogUseCase);
  private readonly requests = inject(StoreRequestRunner);

  private readonly cancel$ = new Subject<void>();
  private readonly backlogSignal = signal<ProjectBacklog | null>(null);
  private readonly loadingBacklogSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly backlog = this.backlogSignal.asReadonly();
  readonly isLoadingBacklog = this.loadingBacklogSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadBacklog(projectId: string): void {
    this.cancel$.next();
    this.errorSignal.set(null);

    this.requests.run({
      loading: this.loadingBacklogSignal,
      request$: this.getProjectBacklogUseCase.execute(projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải dữ liệu Backlog của dự án.',
      onSuccess: (data) => {
        this.backlogSignal.set(data);
      },
      onError: (err) => {
        this.errorSignal.set(err);
      },
    });
  }

  clearBacklog(): void {
    this.cancel$.next();
    this.backlogSignal.set(null);
    this.errorSignal.set(null);
  }
}
