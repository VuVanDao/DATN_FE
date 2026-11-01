import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardDetail } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class GetCardDetailUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string): Observable<CardDetail> {
    return this.boardRepository.getCardDetail(cardId);
  }
}
