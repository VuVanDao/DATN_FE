import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardDetail } from '../../domain/models/board-detail.model';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class GetBoardDetailUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(slug: string, projectId: string): Observable<BoardDetail> {
    return this.boardRepository.getBoardDetail(slug, projectId);
  }
}
