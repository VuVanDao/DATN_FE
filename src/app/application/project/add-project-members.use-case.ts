import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AddProjectMembersRequest, ProjectMember } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class AddProjectMembersUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectId: string, request: AddProjectMembersRequest): Observable<ProjectMember[]> {
    return this.repository.addProjectMembers(projectId, request);
  }
}
