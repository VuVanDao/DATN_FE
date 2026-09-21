import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeleteWorkspaceUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);

  execute = (id: string): Observable<boolean> => {
    return this._workspaceRepository.deleteWorkspace(id);
  };
}
