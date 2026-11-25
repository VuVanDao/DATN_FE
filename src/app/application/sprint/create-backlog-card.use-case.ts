import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CardSummary } from '../../domain/models/board-detail.model';
import { CreateBacklogCardRequest } from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';

@Injectable({ providedIn: 'root' })
export class CreateBacklogCardUseCase {
  private readonly sprintRepository = inject(SprintRepository);

  execute(request: CreateBacklogCardRequest): Observable<CardSummary> {
    return this.sprintRepository.createBacklogCard(request);
  }
}
