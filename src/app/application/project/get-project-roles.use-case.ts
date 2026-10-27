import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectRole } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectRolesUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(): Observable<ProjectRole[]> {
    return this.repository.getProjectRoles();
  }
}
