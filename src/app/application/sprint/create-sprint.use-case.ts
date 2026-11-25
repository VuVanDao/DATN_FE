import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateSprintRequest, SprintSummary } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateSprintUseCase {
  private readonly repository = inject(SprintRepository);

  execute(request: CreateSprintRequest): Observable<SprintSummary> {
    return this.repository.createSprint(request);
  }
}
