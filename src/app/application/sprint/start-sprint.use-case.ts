import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SprintSummary, StartSprintRequest } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class StartSprintUseCase {
  private readonly repository = inject(SprintRepository);

  execute(sprintId: string, request: StartSprintRequest): Observable<SprintSummary> {
    return this.repository.startSprint(sprintId, request);
  }
}
