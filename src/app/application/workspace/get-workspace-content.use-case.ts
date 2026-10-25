import { inject, Injectable } from '@angular/core';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

@Injectable({ providedIn: 'root' })
export class GetWorkspaceContentUseCase {
  private readonly repository = inject(WorkspaceRepository);
  getMembers = (id: string, pageIndex: number) => this.repository.getMembers(id, pageIndex);
  getProjects = (id: string, pageIndex: number) => this.repository.getProjects(id, pageIndex);
}
