import { Observable } from 'rxjs';
import {
  BoardDetail,
  CardSummary,
  ColumnSummary,
  CreateCardRequest,
  CreateColumnRequest,
  MoveCardRequest,
  ReorderColumnsRequest,
  UpdateColumnRequest,
} from '../models/board-detail.model';
import {
  Board,
  BoardPreference,
  MyBoards,
  UpdateBoardPreferenceRequest,
  UpdateBoardRequest,
} from '../models/project.model';

export abstract class BoardRepository {
  abstract getBoardDetail(slug: string, projectId: string): Observable<BoardDetail>;
  abstract updateBoard(boardId: string, request: UpdateBoardRequest): Observable<Board>;
  abstract deleteBoard(boardId: string): Observable<boolean>;
  abstract createColumn(boardId: string, request: CreateColumnRequest): Observable<ColumnSummary>;
  abstract updateColumn(
    boardId: string,
    columnId: string,
    request: UpdateColumnRequest,
  ): Observable<ColumnSummary>;
  abstract reorderColumns(boardId: string, request: ReorderColumnsRequest): Observable<boolean>;
  abstract createCard(request: CreateCardRequest): Observable<CardSummary>;
  abstract moveCard(cardId: string, request: MoveCardRequest): Observable<boolean>;
  abstract deleteCard(cardId: string): Observable<boolean>;
  abstract updateBoardPreference(
    boardId: string,
    request: UpdateBoardPreferenceRequest,
  ): Observable<BoardPreference>;
  abstract getMyBoards(): Observable<MyBoards>;
}
