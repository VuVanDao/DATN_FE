import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReorderColumnsRequest } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class ReorderColumnsUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(boardId: string, request: ReorderColumnsRequest): Observable<boolean> {
    return this.boardRepository.reorderColumns(boardId, request);
  }
}
