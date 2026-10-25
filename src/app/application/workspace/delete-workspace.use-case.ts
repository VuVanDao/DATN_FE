import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteWorkspaceUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);

  execute = (id: string): Observable<boolean> => {
    return this._workspaceRepository.deleteWorkspace(id);
  };
}
