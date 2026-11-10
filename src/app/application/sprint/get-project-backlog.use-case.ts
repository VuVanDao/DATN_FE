import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectBacklog } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectBacklogUseCase {
  private readonly repository = inject(SprintRepository);

  execute(projectId: string, boardId?: string | null): Observable<ProjectBacklog> {
    return this.repository.getProjectBacklog(projectId, boardId);
  }
}
