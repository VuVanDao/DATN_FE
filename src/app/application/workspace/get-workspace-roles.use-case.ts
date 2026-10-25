import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceRole } from '../../domain/models/workspace.model';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({
  providedIn: 'root',
})
export class GetWorkspaceRolesUseCase {
  private readonly _repository = inject(WorkspaceRepository);
  execute(): Observable<WorkspaceRole[]> {
    return this._repository.getWorkspaceRoles();
  }
}
