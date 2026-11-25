import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class RemoveProjectMemberUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectId: string, userId: string): Observable<boolean> {
    return this.repository.removeProjectMember(projectId, userId);
  }
}
