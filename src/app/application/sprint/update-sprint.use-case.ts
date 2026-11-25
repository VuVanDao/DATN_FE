import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SprintSummary, UpdateSprintRequest } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateSprintUseCase {
  private readonly repository = inject(SprintRepository);

  execute(sprintId: string, request: UpdateSprintRequest): Observable<SprintSummary> {
    return this.repository.updateSprint(sprintId, request);
  }
}
