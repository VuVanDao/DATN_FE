import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompleteSprintRequest, SprintSummary } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class CompleteSprintUseCase {
  private readonly repository = inject(SprintRepository);

  execute(sprintId: string, request: CompleteSprintRequest): Observable<SprintSummary> {
    return this.repository.completeSprint(sprintId, request);
  }
}
