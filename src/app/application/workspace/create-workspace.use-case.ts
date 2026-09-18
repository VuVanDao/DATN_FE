import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { CreateWorkspaceRequest, Workspace } from '../../domain/models/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class CreateWorkspaceUseCase {
  private readonly _repository = inject(WorkspaceRepository);

  execute(request: CreateWorkspaceRequest): Observable<Workspace> {
    return this._repository.createWorkspace(request);
  }
}
