import { Observable } from 'rxjs';
import { CardSummary } from '../models/board-detail.model';
import {
  CompleteSprintRequest,
  CreateSprintRequest,
  MoveCardToSprintRequest,
  ProjectBacklog,
  SprintSummary,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../models/sprint.model';

export abstract class SprintRepository {
  abstract createSprint(request: CreateSprintRequest): Observable<SprintSummary>;
  abstract updateSprint(sprintId: string, request: UpdateSprintRequest): Observable<SprintSummary>;
  abstract deleteSprint(sprintId: string): Observable<boolean>;
  abstract startSprint(sprintId: string, request: StartSprintRequest): Observable<SprintSummary>;
  abstract completeSprint(
    sprintId: string,
    request: CompleteSprintRequest,
  ): Observable<SprintSummary>;
  abstract moveCardToSprint(request: MoveCardToSprintRequest): Observable<CardSummary>;
  abstract getProjectSprints(projectId: string): Observable<SprintSummary[]>;
  abstract getProjectBacklog(projectId: string): Observable<ProjectBacklog>;
}
