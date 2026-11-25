import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardSummary, UpdateCardRequest } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateCardUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string, request: Partial<UpdateCardRequest>): Observable<CardSummary> {
    return this.boardRepository.updateCard(cardId, request);
  }
}
