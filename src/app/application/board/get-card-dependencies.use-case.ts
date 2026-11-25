import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardDependenciesResult } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class GetCardDependenciesUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string): Observable<CardDependenciesResult> {
    return this.boardRepository.getCardDependencies(cardId);
  }
}
