import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { UpdateWorkspaceRequest, WorkspaceDetail } from '../../domain/models/workspace.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateWorkspaceUsecase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute = (id: string, requets: UpdateWorkspaceRequest): Observable<WorkspaceDetail> => {
    return this._workspaceRepository.updateWorkspace(id, requets);
  };
}
