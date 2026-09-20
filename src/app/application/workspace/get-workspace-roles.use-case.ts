import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { Observable } from 'rxjs';
import { WorkspaceRole } from '../../domain/models/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class getWorkspaceRolesUsecase {
  private readonly _repository = inject(WorkspaceRepository);
  execute(): Observable<WorkspaceRole[]> {
    return this._repository.getWorkspaceRoles();
  }
}
