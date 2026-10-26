import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({ providedIn: 'root' })
export class GetWorkspaceMembersUseCase {
  private readonly repository = inject(WorkspaceRepository);
  execute(id: string, pageIndex: number) {
    return this.repository.getMembers(id, pageIndex);
  }
}
