import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CardSummary } from '../../domain/models/board-detail.model';
import {
  CompleteSprintRequest,
  CreateBacklogCardRequest,
  CreateSprintRequest,
  MoveCardToSprintRequest,
  ProjectBacklog,
  SprintSummary,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../../domain/models/sprint.model';
import { SprintRepository } from '../../domain/repositories/sprint.repository';
import { ApiResponse } from '../dtos/api-response.dto';

@Injectable({
  providedIn: 'root',
})
export class SprintHttpRepository implements SprintRepository {
  private readonly http = inject(HttpClient);
  private readonly sprintUrl = `${environment.apiUrl}/sprint`;

  createSprint(request: CreateSprintRequest): Observable<SprintSummary> {
    return this.http
      .post<ApiResponse<SprintSummary>>(this.sprintUrl, request)
      .pipe(map((res) => res.data));
  }

  updateSprint(sprintId: string, request: UpdateSprintRequest): Observable<SprintSummary> {
    return this.http
      .put<ApiResponse<SprintSummary>>(`${this.sprintUrl}/${sprintId}`, request)
      .pipe(map((res) => res.data));
  }

  deleteSprint(sprintId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.sprintUrl}/${sprintId}`)
      .pipe(map((res) => res.data));
  }

  startSprint(sprintId: string, request: StartSprintRequest): Observable<SprintSummary> {
    return this.http
      .post<ApiResponse<SprintSummary>>(`${this.sprintUrl}/${sprintId}/start`, request)
      .pipe(map((res) => res.data));
  }

  completeSprint(
    sprintId: string,
    request: CompleteSprintRequest,
  ): Observable<SprintSummary> {
    return this.http
      .post<ApiResponse<SprintSummary>>(`${this.sprintUrl}/${sprintId}/complete`, request)
      .pipe(map((res) => res.data));
  }

  moveCardToSprint(request: MoveCardToSprintRequest): Observable<CardSummary> {
    return this.http
      .post<ApiResponse<CardSummary>>(`${this.sprintUrl}/move-card`, request)
      .pipe(map((res) => res.data));
  }

  getProjectSprints(
    projectId: string,
    boardId?: string | null,
    includeClosed = false,
  ): Observable<SprintSummary[]> {
    let url = `${this.sprintUrl}/project/${projectId}?includeClosed=${includeClosed}`;
    if (boardId) {
      url += `&boardId=${boardId}`;
    }
    return this.http
      .get<ApiResponse<SprintSummary[]>>(url)
      .pipe(map((res) => res.data));
  }

  getProjectBacklogCards(projectId: string, boardId?: string | null): Observable<CardSummary[]> {
    let url = `${environment.apiUrl}/cards/project/${projectId}/backlog`;
    if (boardId) {
      url += `?boardId=${boardId}`;
    }
    return this.http
      .get<ApiResponse<CardSummary[]>>(url)
      .pipe(map((res) => res.data));
  }

  getProjectBacklog(projectId: string, boardId?: string | null): Observable<ProjectBacklog> {
    let url = `${this.sprintUrl}/project/${projectId}/backlog`;
    if (boardId) {
      url += `?boardId=${boardId}`;
    }
    return this.http
      .get<ApiResponse<ProjectBacklog>>(url)
      .pipe(map((res) => res.data));
  }

  createBacklogCard(request: CreateBacklogCardRequest): Observable<CardSummary> {
    return this.http
      .post<ApiResponse<CardSummary>>(`${environment.apiUrl}/cards/backlog`, request)
      .pipe(map((res) => res.data));
  }
}
