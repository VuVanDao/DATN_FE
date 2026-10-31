import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BoardDetail,
  CardSummary,
  ColumnSummary,
  CreateCardRequest,
  CreateColumnRequest,
  MoveCardRequest,
  ReorderColumnsRequest,
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

  updateBoardPreference(
    boardId: string,
    request: UpdateBoardPreferenceRequest,
  ): Observable<BoardPreference> {
    return this.http
      .patch<ApiResponse<BoardPreference>>(`${this.boardUrl}/${boardId}/preferences`, request)
      .pipe(map((res) => res.data));
  }

  getMyBoards(): Observable<MyBoards> {
    return this.http
      .get<ApiResponse<MyBoards>>(`${this.boardUrl}/my-boards`)
      .pipe(map((res) => res.data));
  }
}
