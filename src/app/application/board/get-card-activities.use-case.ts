import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivityLog } from '../../domain/models/activity-log.model';
import { BoardRepository } from '../../domain/repositories/board.repository';
import { PagedResult } from '../../shared/models/paged-result.model';

@Injectable({
  providedIn: 'root',
})
export class GetCardActivitiesUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(
    cardId: string,
    pageIndex = 1,
    pageSize = 20,
  ): Observable<PagedResult<ActivityLog>> {
    return this.boardRepository.getCardActivities(cardId, pageIndex, pageSize);
  }
}
