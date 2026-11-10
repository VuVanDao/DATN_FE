import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SprintSummary } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectSprintsUseCase {
  private readonly repository = inject(SprintRepository);

  execute(
    projectId: string,
    boardId?: string | null,
    includeClosed = false,
  ): Observable<SprintSummary[]> {
    return this.repository.getProjectSprints(projectId, boardId, includeClosed);
  }
}
