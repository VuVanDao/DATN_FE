import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteColumnUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(boardId: string, columnId: string): Observable<boolean> {
    return this.boardRepository.deleteColumn(boardId, columnId);
  }
}
