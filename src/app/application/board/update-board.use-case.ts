import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Board, UpdateBoardRequest } from '../../domain/models/project.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateBoardUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(boardId: string, request: UpdateBoardRequest): Observable<Board> {
    return this.boardRepository.updateBoard(boardId, request);
  }
}
