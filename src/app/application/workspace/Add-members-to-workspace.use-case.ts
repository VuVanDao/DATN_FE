import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
} from '../../domain/models/workspace.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AddMembersToWorksapceUsecase {
  private readonly _repository = inject(WorkspaceRepository);
  execute(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
  ): Observable<AddWorkspaceMembersResponse> {
    return this._repository.addMembers(workspaceId, request);
  }
}
