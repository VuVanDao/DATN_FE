import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { UpdateWorkspaceRequest, WorkspaceDetail } from '../../domain/models/workspace.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateWorkspaceUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute = (id: string, request: UpdateWorkspaceRequest): Observable<WorkspaceDetail> => {
    return this._workspaceRepository.updateWorkspace(id, request);
  };
}
