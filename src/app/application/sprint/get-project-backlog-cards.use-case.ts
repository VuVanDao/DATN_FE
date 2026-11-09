import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardSummary } from '../../domain/models/board-detail.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectBacklogCardsUseCase {
  private readonly repository = inject(SprintRepository);

  execute(projectId: string): Observable<CardSummary[]> {
    return this.repository.getProjectBacklogCards(projectId);
  }
}
