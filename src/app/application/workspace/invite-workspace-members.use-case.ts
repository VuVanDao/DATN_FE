import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResult,
} from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class InviteWorkspaceMembersUseCase {
  private readonly _repository = inject(WorkspaceRepository);
  execute(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
  ): Observable<AddWorkspaceMembersResult> {
    return this._repository.addMembers(workspaceId, request);
  }
}
