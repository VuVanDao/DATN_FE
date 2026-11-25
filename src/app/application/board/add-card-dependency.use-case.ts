import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddCardDependencyRequest,
  CardDependencyItem,
} from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class AddCardDependencyUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(
    cardId: string,
    request: AddCardDependencyRequest,
  ): Observable<CardDependencyItem> {
    return this.boardRepository.addCardDependency(cardId, request);
  }
}
