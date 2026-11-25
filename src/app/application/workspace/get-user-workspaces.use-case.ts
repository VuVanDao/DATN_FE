import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Workspace } from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class GetUserWorkspacesUseCase {
  private readonly _repository = inject(WorkspaceRepository);

  execute(): Observable<Workspace[]> {
    return this._repository.getUserWorkspaces();
  }
}
