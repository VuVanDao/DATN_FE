import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteCardUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(cardId: string): Observable<boolean> {
    return this.boardRepository.deleteCard(cardId);
  }
}
