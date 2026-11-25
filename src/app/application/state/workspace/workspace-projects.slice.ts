import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CreateProjectRequest, Project } from '../../../domain/models/project.model';
import { WorkspaceProject } from '../../../domain/models/workspace.model';
import { CreateProjectUseCase } from '../../project/create-project.use-case';
import { GetWorkspaceProjectsUseCase } from '../../workspace/get-workspace-projects.use-case';
import { PagedListState } from '../paged-list-state.util';
import { StoreRequestRunner } from '../store-request.util';

@Injectable({ providedIn: 'root' })
export class WorkspaceProjectsSlice {
  private readonly requests = inject(StoreRequestRunner);
  private readonly getProjects = inject(GetWorkspaceProjectsUseCase);
  private readonly create = inject(CreateProjectUseCase);
  private readonly cancel$ = new Subject<void>();
  private readonly creating = signal(false);
  readonly projects = new PagedListState<WorkspaceProject>(this.requests, (id, page) =>
    this.getProjects.execute(id, page),
  ); // danh sach các dự án của 1 workspace
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

  patchProject(project: Project): void {
    this.projects.patch((items) =>
      items.map((item) =>
        item.id === project.id
          ? {
              ...item,
              name: project.name,
              projectKey: project.projectKey,
              description: project.description,
            }
          : item,
      ),
    );
  }

  clear(): void {
    this.cancel$.next();
    this.projects.clear();
  }
}
