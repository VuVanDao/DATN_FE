import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardRepository } from '../../domain/repositories/board.repository';

@Injectable({
  providedIn: 'root',
})
export class RemoveCardDependencyUseCase {
  private readonly boardRepository = inject(BoardRepository);

  execute(dependencyId: string): Observable<boolean> {
    return this.boardRepository.removeCardDependency(dependencyId);
  }
}
