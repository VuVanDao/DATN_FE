import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Board } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class GetProjectBoardsUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(projectId: string): Observable<Board[]> {
    return this.repository.getProjectBoards(projectId);
  }
}
