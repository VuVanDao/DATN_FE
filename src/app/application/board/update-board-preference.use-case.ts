import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardPreference, UpdateBoardPreferenceRequest } from '../../domain/models/project.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateBoardPreferenceUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(boardId: string, request: UpdateBoardPreferenceRequest): Observable<BoardPreference> {
    return this.boardRepository.updateBoardPreference(boardId, request);
  }
}
