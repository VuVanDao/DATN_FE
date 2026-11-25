import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardCandidate } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class SearchCardCandidatesUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string, query?: string): Observable<CardCandidate[]> {
    return this.boardRepository.searchCardCandidates(cardId, query);
  }
}
