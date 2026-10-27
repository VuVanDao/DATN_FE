import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectMember } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectMembersUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectId: string): Observable<ProjectMember[]> {
    return this.repository.getProjectMembers(projectId);
  }
}
