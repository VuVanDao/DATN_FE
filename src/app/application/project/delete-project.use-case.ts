import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteProjectUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectId: string): Observable<boolean> {
    return this.repository.deleteProject(projectId);
  }
}
