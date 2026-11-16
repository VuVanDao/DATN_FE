import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityLog } from '../../domain/models/activity-log.model';
import { PagedResult } from '../../shared/models/paged-result.model';
import {
  AddCardDependencyRequest,
  BoardDetail,
  CardCandidate,
  CardComment,
  CardDependenciesResult,
  CardDependencyItem,
  CardDetail,
  CardSummary,
  ColumnSummary,
  CreateCardRequest,
  CreateColumnRequest,
  MoveCardRequest,
  ReorderColumnsRequest,
  UpdateCardRequest,
  UpdateColumnRequest,
} from '../../domain/models/board-detail.model';
import {
  Board,
  BoardPreference,
  MyBoards,
  UpdateBoardPreferenceRequest,
  UpdateBoardRequest,
} from '../../domain/models/project.model';
import { BoardRepository } from '../../domain/repositories/board.repository';
import { ApiResponse } from '../dtos/api-response.dto';

@Injectable({
  providedIn: 'root',
})
export class BoardHttpRepository implements BoardRepository {
  private readonly http = inject(HttpClient);
  private readonly boardUrl = `${environment.apiUrl}/board`;
  private readonly cardsUrl = `${environment.apiUrl}/cards`;

  getBoardDetail(slug: string, projectId: string): Observable<BoardDetail> {
    return this.http
      .get<ApiResponse<BoardDetail>>(`${this.boardUrl}/${slug}/project/${projectId}`)
      .pipe(map((res) => res.data));
  }

  updateBoard(boardId: string, request: UpdateBoardRequest): Observable<Board> {
    return this.http
      .put<ApiResponse<Board>>(`${this.boardUrl}/${boardId}`, {
        boardId,
        title: request.title,
        slug: request.slug,
        type: request.type,
      })
      .pipe(map((res) => res.data));
  }

  deleteBoard(boardId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.boardUrl}/${boardId}`)
      .pipe(map((res) => res.data));
  }

  createColumn(boardId: string, request: CreateColumnRequest): Observable<ColumnSummary> {
    return this.http
      .post<ApiResponse<ColumnSummary>>(`${this.boardUrl}/${boardId}/columns`, {
        boardId,
        title: request.title,
        isDoneColumn: request.isDoneColumn ?? false,
      })
      .pipe(map((res) => res.data));
  }

  updateColumn(
    boardId: string,
    columnId: string,
    request: UpdateColumnRequest,
  ): Observable<ColumnSummary> {
    return this.http
      .put<ApiResponse<ColumnSummary>>(`${this.boardUrl}/${boardId}/columns/${columnId}`, {
        boardId,
        columnId,
        title: request.title,
        isDoneColumn: request.isDoneColumn,
      })
      .pipe(map((res) => res.data));
  }

  deleteColumn(boardId: string, columnId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.boardUrl}/${boardId}/columns/${columnId}`)
      .pipe(map((res) => res.data));
  }

  reorderColumns(boardId: string, request: ReorderColumnsRequest): Observable<boolean> {
    return this.http
      .put<ApiResponse<boolean>>(`${this.boardUrl}/${boardId}/columns/reorder`, {
        boardId,
        orderedColumnIds: request.orderedColumnIds,
      })
      .pipe(map((res) => res.data));
  }

  createCard(request: CreateCardRequest): Observable<CardSummary> {
    return this.http
      .post<ApiResponse<CardSummary>>(this.cardsUrl, request)
      .pipe(map((res) => res.data));
  }

  getCardDetail(cardId: string): Observable<CardDetail> {
    return this.http
      .get<ApiResponse<CardDetail>>(`${this.cardsUrl}/${cardId}`)
      .pipe(map((res) => res.data));
  }

  updateCard(cardId: string, request: Partial<UpdateCardRequest>): Observable<CardSummary> {
    const formData = new FormData();
    formData.append('cardId', cardId);

    if (request.title !== undefined && request.title !== null) {
      formData.append('title', request.title.trim());
    }
    if (request.description !== undefined && request.description !== null) {
      formData.append('description', request.description);
    }
    if (request.coverImage) {
      formData.append('coverImage', request.coverImage, request.coverImage.name);
    } else if (request.coverUrl !== undefined && request.coverUrl !== null) {
      formData.append('coverUrl', request.coverUrl);
    }
    if (request.type !== undefined && request.type !== null) {
      formData.append('type', String(request.type));
    }
    if (request.priority !== undefined && request.priority !== null) {
      formData.append('priority', String(request.priority));
    }
    if (request.assigneeId) {
      formData.append('assigneeId', request.assigneeId);
    }
    if (request.startDate) {
      formData.append('startDate', request.startDate);
    }
    if (request.dueDate) {
      formData.append('dueDate', request.dueDate);
    }
    if (request.storyPoints !== undefined) {
      formData.append(
        'storyPoints',
        request.storyPoints !== null ? String(request.storyPoints) : '',
      );
    }
    if (request.progressPercentage !== undefined && request.progressPercentage !== null) {
      formData.append('progressPercentage', String(request.progressPercentage));
    }

    return this.http
      .put<ApiResponse<CardSummary>>(`${this.cardsUrl}/${cardId}`, formData)
      .pipe(map((res) => res.data));
  }

  moveCard(cardId: string, request: MoveCardRequest): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.cardsUrl}/${cardId}/move`, request)
      .pipe(map((res) => res.data));
  }

  deleteCard(cardId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.cardsUrl}/${cardId}`)
      .pipe(map((res) => res.data));
  }

  addCardComment(cardId: string, contentText: string): Observable<CardComment> {
    return this.http
      .post<ApiResponse<CardComment>>(`${this.cardsUrl}/${cardId}/comments`, { contentText })
      .pipe(map((res) => res.data));
  }

  updateBoardPreference(
    boardId: string,
    request: UpdateBoardPreferenceRequest,
  ): Observable<BoardPreference> {
    return this.http
      .patch<ApiResponse<BoardPreference>>(`${this.boardUrl}/${boardId}/preferences`, request)
      .pipe(map((res) => res.data));
  }

  getMyBoards(limit?: number): Observable<MyBoards> {
    let params: HttpParams | undefined;
    if (limit && limit > 0) {
      params = new HttpParams().set('limit', limit.toString());
    }
    return this.http
      .get<ApiResponse<MyBoards>>(`${this.boardUrl}/my-boards`, { params })
      .pipe(map((res) => res.data));
  }

  addCardDependency(
    cardId: string,
    request: AddCardDependencyRequest,
  ): Observable<CardDependencyItem> {
    return this.http
      .post<ApiResponse<CardDependencyItem>>(`${this.cardsUrl}/${cardId}/dependencies`, {
        targetCardId: request.targetCardId,
        direction: request.direction,
      })
      .pipe(map((res) => res.data));
  }

  removeCardDependency(dependencyId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.cardsUrl}/dependencies/${dependencyId}`)
      .pipe(map((res) => res.data));
  }

  getCardDependencies(cardId: string): Observable<CardDependenciesResult> {
    return this.http
      .get<ApiResponse<CardDependenciesResult>>(`${this.cardsUrl}/${cardId}/dependencies`)
      .pipe(map((res) => res.data));
  }

  searchCardCandidates(
    cardId: string,
    query?: string,
  ): Observable<CardCandidate[]> {
    let params = new HttpParams();
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }
    return this.http
      .get<ApiResponse<CardCandidate[]>>(`${this.cardsUrl}/${cardId}/dependency-candidates`, {
        params,
      })
      .pipe(map((res) => res.data));
  }

  getCardActivities(
    cardId: string,
    pageIndex = 1,
    pageSize = 20,
  ): Observable<PagedResult<ActivityLog>> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<ApiResponse<PagedResult<ActivityLog>>>(
        `${this.cardsUrl}/${cardId}/activities`,
        { params },
      )
      .pipe(map((res) => res.data));
  }
}
