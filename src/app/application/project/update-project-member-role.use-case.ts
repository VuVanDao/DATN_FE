import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectMember, UpdateProjectMemberRoleRequest } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateProjectMemberRoleUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberRoleRequest,
  ): Observable<ProjectMember> {
    return this.repository.updateProjectMemberRole(projectId, userId, request);
  }
}
