import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CreateProjectRequest, Project } from '../../../domain/models/project.model';
import { CreateProjectUseCase } from '../../project/create-project.use-case';
import { StoreRequestRunner } from '../store-request.util';

@Injectable({ providedIn: 'root' })
export class ProjectSlice {
  private readonly requests = inject(StoreRequestRunner);
  private readonly create = inject(CreateProjectUseCase);
  private readonly cancel$ = new Subject<void>();
  private readonly creating = signal(false);
  readonly isCreatingProject = this.creating.asReadonly();

  createProject(request: CreateProjectRequest, onSuccess?: (project: Project) => void): void {
    if (this.creating()) return;
    this.requests.run({
      loading: this.creating,
      request$: this.create.execute(request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo dự án thất bại, vui lòng thử lại.',
      onSuccess,
    });
  }

  clear(): void {
    this.cancel$.next();
  }
}
