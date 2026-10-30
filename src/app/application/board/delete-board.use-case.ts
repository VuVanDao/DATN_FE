import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteBoardUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(boardId: string): Observable<boolean> {
    return this.boardRepository.deleteBoard(boardId);
  }
}
