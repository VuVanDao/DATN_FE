import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectDetailUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectKey: string, workspaceId: string): Observable<Project> {
    return this.repository.getProjectDetail(projectKey, workspaceId);
  }
}
