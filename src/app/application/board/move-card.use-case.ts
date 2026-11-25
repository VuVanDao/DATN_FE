import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MoveCardRequest } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class MoveCardUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string, request: MoveCardRequest): Observable<boolean> {
    return this.boardRepository.moveCard(cardId, request);
  }
}
