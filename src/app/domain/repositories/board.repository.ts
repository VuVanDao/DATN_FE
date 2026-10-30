import { Observable } from 'rxjs';
import {
  BoardDetail,
  CardSummary,
  ColumnSummary,
  CreateCardRequest,
  CreateColumnRequest,
  MoveCardRequest,
  ReorderColumnsRequest,
} from '../models/board-detail.model';
import {
  Board,
  BoardPreference,
  UpdateBoardPreferenceRequest,
  UpdateBoardRequest,
} from '../models/project.model';

export abstract class BoardRepository {
  abstract getBoardDetail(slug: string, projectId: string): Observable<BoardDetail>;
  abstract updateBoard(boardId: string, request: UpdateBoardRequest): Observable<Board>;
  abstract deleteBoard(boardId: string): Observable<boolean>;
  abstract createColumn(boardId: string, request: CreateColumnRequest): Observable<ColumnSummary>;
  abstract reorderColumns(boardId: string, request: ReorderColumnsRequest): Observable<boolean>;
  abstract createCard(request: CreateCardRequest): Observable<CardSummary>;
  abstract moveCard(cardId: string, request: MoveCardRequest): Observable<boolean>;
  abstract deleteCard(cardId: string): Observable<boolean>;
  abstract updateBoardPreference(
    boardId: string,
    request: UpdateBoardPreferenceRequest,
  ): Observable<BoardPreference>;
}
