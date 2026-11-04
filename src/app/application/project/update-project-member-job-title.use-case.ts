import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ProjectMember,
  UpdateProjectMemberJobTitleRequest,
} from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateProjectMemberJobTitleUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberJobTitleRequest,
  ): Observable<ProjectMember> {
    return this.repository.updateProjectMemberJobTitle(projectId, userId, request);
  }
}
