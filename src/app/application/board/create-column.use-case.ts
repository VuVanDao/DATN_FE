import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ColumnSummary, CreateColumnRequest } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateColumnUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(boardId: string, request: CreateColumnRequest): Observable<ColumnSummary> {
    return this.boardRepository.createColumn(boardId, request);
  }
}
