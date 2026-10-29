import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardSummary, CreateCardRequest } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateCardUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(request: CreateCardRequest): Observable<CardSummary> {
    return this.boardRepository.createCard(request);
  }
}
