import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ColumnSummary, UpdateColumnRequest } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateColumnUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(
    boardId: string,
    columnId: string,
    request: UpdateColumnRequest,
  ): Observable<ColumnSummary> {
    return this.boardRepository.updateColumn(boardId, columnId, request);
  }
}
