import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class RemoveMemberFromWorkspaceUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute = (workspaceId: string, memberId: string): Observable<boolean> => {
    return this._workspaceRepository.removeMember(workspaceId, memberId);
  };
}
