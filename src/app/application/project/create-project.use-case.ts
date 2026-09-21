import { inject, Injectable } from '@angular/core';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { Observable } from 'rxjs';
import { CreateProjectRequest, Project } from '../../domain/models/project.model';

@Injectable({
  providedIn: 'root',
})
export class CreateProjectUsecase {
  private readonly _projectRepo = inject(ProjectRepository);
  execute(request: CreateProjectRequest): Observable<Project> {
    return this._projectRepo.createPrject(request);
  }
}
