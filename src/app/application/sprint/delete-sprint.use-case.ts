import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({
  providedIn: 'root',
})
export class DeleteSprintUseCase {
  private readonly repository = inject(SprintRepository);

  execute(sprintId: string): Observable<boolean> {
    return this.repository.deleteSprint(sprintId);
  }
}
