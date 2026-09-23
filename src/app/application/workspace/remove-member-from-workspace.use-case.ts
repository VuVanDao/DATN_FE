import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RemoveMemberFromWorkspaceUseCase {
  private readonly _workspaceRepository = inject(WorkspaceRepository);
  execute = (workspaceId: string, memberId: string): Observable<boolean> => {
    return this._workspaceRepository.removeMember(workspaceId, memberId);
  };
}
