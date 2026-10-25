import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateWorkspaceRequest, WorkspaceDetail } from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateWorkspaceUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute = (id: string, request: UpdateWorkspaceRequest): Observable<WorkspaceDetail> => {
    return this._workspaceRepository.updateWorkspace(id, request);
  };
}
