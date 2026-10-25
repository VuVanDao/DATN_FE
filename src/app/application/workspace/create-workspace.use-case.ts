import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWorkspaceRequest, Workspace } from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateWorkspaceUseCase {
  private readonly _repository = inject(WorkspaceRepository);

  execute(request: CreateWorkspaceRequest): Observable<Workspace> {
    return this._repository.createWorkspace(request);
  }
}
