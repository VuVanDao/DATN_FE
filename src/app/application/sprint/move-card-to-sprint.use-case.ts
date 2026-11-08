import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardSummary } from '../../domain/models/board-detail.model';
import { MoveCardToSprintRequest } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class MoveCardToSprintUseCase {
  private readonly repository = inject(SprintRepository);

  execute(request: MoveCardToSprintRequest): Observable<CardSummary> {
    return this.repository.moveCardToSprint(request);
  }
}
