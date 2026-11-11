import { Observable } from 'rxjs';
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
  abstract deleteColumn(boardId: string, columnId: string): Observable<boolean>;
  abstract reorderColumns(boardId: string, request: ReorderColumnsRequest): Observable<boolean>;
  abstract createCard(request: CreateCardRequest): Observable<CardSummary>;
  abstract getCardDetail(cardId: string): Observable<CardDetail>;
  abstract updateCard(cardId: string, request: Partial<UpdateCardRequest>): Observable<CardSummary>;
  abstract moveCard(cardId: string, request: MoveCardRequest): Observable<boolean>;
  abstract deleteCard(cardId: string): Observable<boolean>;
  abstract addCardComment(cardId: string, contentText: string): Observable<CardComment>;
  abstract updateBoardPreference(
    boardId: string,
    request: UpdateBoardPreferenceRequest,
  ): Observable<BoardPreference>;
  abstract getMyBoards(limit?: number): Observable<MyBoards>;
  abstract addCardDependency(
    cardId: string,
    request: AddCardDependencyRequest,
  ): Observable<CardDependencyItem>;
  abstract removeCardDependency(dependencyId: string): Observable<boolean>;
  abstract getCardDependencies(cardId: string): Observable<CardDependenciesResult>;
  abstract searchCardCandidates(
    cardId: string,
    query?: string,
  ): Observable<CardCandidate[]>;
}
