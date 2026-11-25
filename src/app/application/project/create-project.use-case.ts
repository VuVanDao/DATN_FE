import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateProjectRequest, Project } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateProjectUseCase {
  private readonly _projectRepo = inject(ProjectRepository);
  execute(request: CreateProjectRequest): Observable<Project> {
    return this._projectRepo.createProject(request);
  }
}
