import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardPreference, UpdateBoardPreferenceRequest } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({ providedIn: 'root' })
export class UpdateBoardPreferenceUseCase {
  private readonly projectRepository = inject(ProjectRepository);

  execute(
    boardId: string,
    request: UpdateBoardPreferenceRequest,
  ): Observable<BoardPreference> {
    return this.projectRepository.updateBoardPreference(boardId, request);
  }
}
