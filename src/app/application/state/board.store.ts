import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  BoardDetail,
  CardComment,
  CardSummary,
  UpdateCardRequest,
} from '../../domain/models/board-detail.model';
import {
  Board,
  UpdateBoardRequest,
} from '../../domain/models/project.model';
import { BoardCardsSlice } from './board/board-cards.slice';
import { BoardColumnsSlice } from './board/board-columns.slice';
import { BoardDetailSlice } from './board/board-detail.slice';
import { BoardRealtimeSlice } from './board/board-realtime.slice';
import { CardDetailSlice } from './board/card-detail.slice';
import { MyBoardsSlice } from './board/my-boards.slice';

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly _boardDetail = inject(BoardDetailSlice);
  private readonly _boardColumns = inject(BoardColumnsSlice);
  private readonly _boardCards = inject(BoardCardsSlice);
  private readonly _cardDetail = inject(CardDetailSlice);
  private readonly _boardRealtime = inject(BoardRealtimeSlice);
  private readonly _myBoards = inject(MyBoardsSlice);

  private readonly cancel$ = new Subject<void>();

  readonly currentBoard = this._boardDetail.currentBoard;
  readonly columns = this._boardColumns.columns;
  readonly currentCardDetail = this._cardDetail.currentCardDetail;
  readonly isLoadingCardDetail = this._cardDetail.isLoadingCardDetail;
  readonly isLoading = this._boardDetail.isLoading;
  readonly error = this._boardDetail.error;
  readonly isAddingColumn = this._boardColumns.isAddingColumn;
  readonly isAddingCard = this._boardCards.isAddingCard;
  readonly isUpdatingBoard = this._boardDetail.isUpdatingBoard;
  readonly isDeletingBoard = this._boardDetail.isDeletingBoard;
  readonly myBoards = this._myBoards.myBoards;
  readonly isLoadingMyBoards = this._myBoards.isLoadingMyBoards;

  loadBoard(slug: string, projectId: string, onSuccess?: (board: BoardDetail) => void): void {
    this.cancel$.next();

    this._boardDetail.loadBoard(slug, projectId, (board) => {
      this._boardColumns.setColumns(board.columns || []);
      this._boardRealtime.joinBoard(board.id);
      onSuccess?.(board);
    });
  }

  createColumn(boardId: string, title: string, isDoneColumn = false, onSuccess?: () => void): void {
    this._boardColumns.createColumn(boardId, title, isDoneColumn, onSuccess);
  }

  updateColumn(
    columnId: string,
    title: string,
    isDoneColumn?: boolean,
    onSuccess?: () => void,
    onError?: (error: string) => void,
  ): void {
    this._boardColumns.updateColumn(columnId, title, isDoneColumn, onSuccess, onError);
  }

  deleteColumn(columnId: string, onSuccess?: () => void, onError?: (error: string) => void): void {
    this._boardColumns.deleteColumn(columnId, onSuccess, onError);
  }

  reorderColumns(previousIndex: number, currentIndex: number): void {
    this._boardColumns.reorderColumns(previousIndex, currentIndex);
  }

  createCard(
    columnId: string,
    title: string,
    description?: string,
    sprintId?: string | null,
    onSuccess?: (card: CardSummary) => void,
    onError?: (error: string) => void,
  ): void {
    this._boardCards.createCard(columnId, title, description, sprintId, onSuccess, onError);
  }

  moveCard(
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    previousIndex: number,
    currentIndex: number,
  ): void {
    this._boardCards.moveCard(
      cardId,
      sourceColumnId,
      targetColumnId,
      previousIndex,
      currentIndex,
      (movedId, newColId, isCompleted) => {
        if (this._cardDetail.currentCardDetail()?.id === movedId) {
          this._cardDetail.updateActiveCardLocally((d) =>
            d ? { ...d, columnId: newColId, isCompleted } : null,
          );
        }
      },
      () => {
        const currentBoard = this._boardDetail.currentBoard();
        if (currentBoard) {
          this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
        }
      },
    );
  }

  updateCardTitle(cardId: string, columnId: string, title: string): void {
    this._boardCards.updateCardTitle(cardId, columnId, title);
  }

  deleteCard(cardId: string, columnId: string): void {
    this._boardCards.deleteCard(cardId, columnId, (deletedId) => {
      this._cardDetail.clearIfActive(deletedId);
    });
  }

  loadCardDetail(cardId: string, onError?: (err: string) => void): void {
    this._cardDetail.loadCardDetail(cardId, onError);
  }

  clearCardDetail(): void {
    this._cardDetail.clearCardDetail();
  }

  removeCardLocally(cardId: string): void {
    this._boardCards.removeCardLocally(cardId);
    this._cardDetail.clearIfActive(cardId);
  }

  removeColumnLocally(columnId: string): void {
    this._boardColumns.updateColumnsLocally((cols) => cols.filter((col) => col.id !== columnId));
    this._boardDetail.updateBoardLocally((b) =>
      b
        ? {
            ...b,
            columns: (b.columns || []).filter((col) => col.id !== columnId),
          }
        : null,
    );
  }

  updateCard(
    cardId: string,
    updates: Partial<UpdateCardRequest> & {
      assigneeName?: string | null;
      assigneeAvatarUrl?: string | null;
    },
    onSuccess?: (updated: CardSummary) => void,
    onError?: (err: string) => void,
    silent = false,
  ): void {
    this._cardDetail.updateCard(
      cardId,
      updates,
      onSuccess,
      onError,
      silent,
      () => {
        const currentBoard = this._boardDetail.currentBoard();
        if (currentBoard) {
          this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
        }
      },
    );
  }

  addCardComment(
    cardId: string,
    contentText: string,
    onSuccess?: (comment: CardComment) => void,
  ): void {
    this._cardDetail.addCardComment(cardId, contentText, onSuccess);
  }

  moveCardToColumn(cardId: string, targetColumnId: string, onSuccess?: () => void): void {
    this._boardCards.moveCardToColumn(
      cardId,
      targetColumnId,
      onSuccess,
      (movedId, newColId, isCompleted) => {
        if (this._cardDetail.currentCardDetail()?.id === movedId) {
          this._cardDetail.updateActiveCardLocally((d) =>
            d ? { ...d, columnId: newColId, isCompleted } : null,
          );
        }
      },
      () => {
        const currentBoard = this._boardDetail.currentBoard();
        if (currentBoard) {
          this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
        }
      },
    );
  }

  toggleBoardPin(
    boardId?: string,
    currentPinned?: boolean,
    onSuccess?: (isPinned: boolean) => void,
    onError?: (previousPinned: boolean) => void,
  ): void {
    const targetBoardId = boardId ?? this._boardDetail.currentBoard()?.id;
    if (!targetBoardId) return;

    const previousPinned = currentPinned ?? !!this._boardDetail.currentBoard()?.isPinned;
    const nextPinned = !previousPinned;

    if (this._boardDetail.currentBoard()?.id === targetBoardId) {
      this._boardDetail.updateBoardLocally((b) => (b ? { ...b, isPinned: nextPinned } : null));
    }

    this._myBoards.toggleBoardPin(
      targetBoardId,
      previousPinned,
      (isPinned) => {
        if (this._boardDetail.currentBoard()?.id === targetBoardId) {
          this._boardDetail.updateBoardLocally((b) => (b ? { ...b, isPinned } : null));
        }
        onSuccess?.(isPinned);
      },
      (prevPinned) => {
        if (this._boardDetail.currentBoard()?.id === targetBoardId) {
          this._boardDetail.updateBoardLocally((b) => (b ? { ...b, isPinned: prevPinned } : null));
        }
        onError?.(prevPinned);
      },
    );
  }

  updateBoard(
    boardId: string,
    request: UpdateBoardRequest,
    onSuccess?: (updated: Board) => void,
    onError?: (error: string) => void,
  ): void {
    this._boardDetail.updateBoard(boardId, request, onSuccess, onError);
  }

  deleteBoard(boardId: string, onSuccess?: () => void, onError?: (error: string) => void): void {
    this._boardDetail.deleteBoard(boardId, onSuccess, onError);
  }

  setBoardPinnedLocally(isPinned: boolean): void {
    this._boardDetail.setBoardPinnedLocally(isPinned);
  }

  loadMyBoards(limit?: number): void {
    this._myBoards.loadMyBoards(limit);
  }

  clear(): void {
    const current = this._boardDetail.currentBoard();
    if (current) {
      this._boardRealtime.leaveBoard(current.id);
    }
    this.cancel$.next();
    this._cardDetail.clear();
    this._boardDetail.clear();
    this._boardColumns.clear();
    this._boardCards.clear();
  }

  refreshBoard(): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (currentBoard) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    }
  }

  private silentReloadBoard(slug: string, projectId: string): void {
    this._boardDetail.silentReloadBoard(slug, projectId, (board) => {
      this._boardColumns.setColumns(board.columns || []);
    });
  }
}
