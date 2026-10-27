import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Board, CreateBoardRequest } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateBoardUseCase {
  private readonly repository = inject(ProjectRepository);

  execute(request: CreateBoardRequest): Observable<Board> {
    return this.repository.createBoard(request);
  }
}
