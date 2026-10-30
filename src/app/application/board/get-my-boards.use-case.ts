import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MyBoards } from '../../domain/models/project.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class GetMyBoardsUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(): Observable<MyBoards> {
    return this.boardRepository.getMyBoards();
  }
}
