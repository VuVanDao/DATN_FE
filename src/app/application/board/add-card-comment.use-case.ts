import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardComment } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class AddCardCommentUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string, contentText: string): Observable<CardComment> {
    return this.boardRepository.addCardComment(cardId, contentText);
  }
}
