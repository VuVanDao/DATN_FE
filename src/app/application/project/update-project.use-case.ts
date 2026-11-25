import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project, UpdateProjectRequest } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateProjectUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectId: string, request: UpdateProjectRequest): Observable<Project> {
    return this.repository.updateProject(projectId, request);
  }
}
