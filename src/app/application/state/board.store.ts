import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  BoardDetail,
  CardComment,
  CardSummary,
  ColumnSummary,
  UpdateCardRequest,
} from '../../domain/models/board-detail.model';
import {
  CardMovedMessage,
  ColumnsReorderedMessage,
  ColumnCreatedMessage,
  ColumnUpdatedMessage,
  ColumnDeletedMessage,
  CardCreatedMessage,
  CardUpdatedMessage,
  CardDeletedMessage,
  SprintStartedMessage,
  SprintUpdatedMessage,
  SprintCompletedMessage,
  SprintDeletedMessage,
  CardSprintChangedMessage,
  CardCommentAddedMessage,
} from '../../domain/models/board-realtime.model';
import {
  Board,
  UpdateBoardRequest,
} from '../../domain/models/project.model';
import { BoardRealtimeService } from '../../infrastructure/realtime/board-realtime.service';
import { AuthStore } from './auth.store';
import { NotificationService } from '../shared/notification.service';
import { BoardCardsSlice } from './board/board-cards.slice';
import { BoardColumnsSlice } from './board/board-columns.slice';
import { BoardDetailSlice } from './board/board-detail.slice';
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
  private readonly _myBoards = inject(MyBoardsSlice);

  private readonly notifications = inject(NotificationService);
  private readonly boardRealtimeService = inject(BoardRealtimeService);
  private readonly authStore = inject(AuthStore);

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

  constructor() {
    this.setupRealtimeListeners();
  }

  loadBoard(slug: string, projectId: string, onSuccess?: (board: BoardDetail) => void): void {
    this.cancel$.next();

    this._boardDetail.loadBoard(slug, projectId, (board) => {
      this._boardColumns.setColumns(board.columns || []);
      this.boardRealtimeService?.joinBoard(board.id);
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

    // 1. Cập nhật lạc quan bảng đang mở (nếu trùng ID)
    if (this._boardDetail.currentBoard()?.id === targetBoardId) {
      this._boardDetail.updateBoardLocally((b) => (b ? { ...b, isPinned: nextPinned } : null));
    }

    // 2. Delegate qua MyBoardsSlice
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
      this.boardRealtimeService?.leaveBoard(current.id);
    }
    this.cancel$.next();
    this._cardDetail.clear();
    this._boardDetail.clear();
    this._boardColumns.clear();
    this._boardCards.clear();
  }

  private setupRealtimeListeners(): void {
    this.boardRealtimeService?.columnsReordered$?.subscribe({
      next: (message) => this.handleRemoteColumnsReordered(message),
    });

    this.boardRealtimeService?.cardMoved$?.subscribe({
      next: (message) => this.handleRemoteCardMoved(message),
    });

    this.boardRealtimeService?.columnCreated$?.subscribe({
      next: (message) => this.handleRemoteColumnCreated(message),
    });

    this.boardRealtimeService?.columnUpdated$?.subscribe({
      next: (message) => this.handleRemoteColumnUpdated(message),
    });

    this.boardRealtimeService?.columnDeleted$?.subscribe({
      next: (message) => this.handleRemoteColumnDeleted(message),
    });

    this.boardRealtimeService?.cardCreated$?.subscribe({
      next: (message) => this.handleRemoteCardCreated(message),
    });

    this.boardRealtimeService?.cardUpdated$?.subscribe({
      next: (message) => this.handleRemoteCardUpdated(message),
    });

    this.boardRealtimeService?.cardDeleted$?.subscribe({
      next: (message) => this.handleRemoteCardDeleted(message),
    });

    this.boardRealtimeService?.sprintStarted$?.subscribe({
      next: (message) => this.handleRemoteSprintStarted(message),
    });

    this.boardRealtimeService?.sprintUpdated$?.subscribe({
      next: (message) => this.handleRemoteSprintUpdated(message),
    });

    this.boardRealtimeService?.sprintCompleted$?.subscribe({
      next: (message) => this.handleRemoteSprintCompleted(message),
    });

    this.boardRealtimeService?.sprintDeleted$?.subscribe({
      next: (message) => this.handleRemoteSprintDeleted(message),
    });

    this.boardRealtimeService?.cardSprintChanged$?.subscribe({
      next: (message) => this.handleRemoteCardSprintChanged(message),
    });

    this.boardRealtimeService?.cardDependencyAdded$?.subscribe({
      next: (message) =>
        this.handleRemoteCardDependencyChanged(
          message.boardId,
          message.blockedCardId,
          message.blockingCardId,
        ),
    });

    this.boardRealtimeService?.cardDependencyRemoved$?.subscribe({
      next: (message) =>
        this.handleRemoteCardDependencyChanged(
          message.boardId,
          message.blockedCardId,
          message.blockingCardId,
        ),
    });

    this.boardRealtimeService?.cardCommentAdded$?.subscribe({
      next: (message) => this.handleRemoteCardCommentAdded(message),
    });

    this.boardRealtimeService?.reconnected$?.subscribe({
      next: () => {
        const currentBoard = this._boardDetail.currentBoard();
        if (currentBoard) {
          this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
        }
      },
    });

    this.authStore?.ended$?.subscribe({
      next: () => {
        this.boardRealtimeService?.stopConnection();
      },
    });
  }

  private handleRemoteColumnCreated(message: ColumnCreatedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this._boardColumns.columns();
    if (currentCols.some((c) => c.id.toLowerCase() === message.columnId.toLowerCase())) {
      return;
    }

    const newCol: ColumnSummary = {
      id: message.columnId,
      boardId: message.boardId,
      title: message.title,
      position: message.position,
      isDoneColumn: message.isDoneColumn,
      cards: [],
    };

    const nextCols = [...currentCols, newCol].sort((a, b) => a.position - b.position);
    this._boardColumns.setColumns(nextCols);
    this._boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: nextCols } : null));
    this.notifications.info(`Cột "${message.title}" vừa được thêm bởi thành viên khác.`);
  }

  private handleRemoteColumnUpdated(message: ColumnUpdatedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    this._boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) =>
        col.id.toLowerCase() === message.columnId.toLowerCase()
          ? {
              ...col,
              title: message.title,
              isDoneColumn: message.isDoneColumn,
              position: message.position,
            }
          : col,
      ),
    );

    this._boardDetail.updateBoardLocally((b) =>
      b
        ? {
            ...b,
            columns: (b.columns || []).map((col) =>
              col.id.toLowerCase() === message.columnId.toLowerCase()
                ? {
                    ...col,
                    title: message.title,
                    isDoneColumn: message.isDoneColumn,
                    position: message.position,
                  }
                : col,
            ),
          }
        : null,
    );
  }

  private handleRemoteColumnDeleted(message: ColumnDeletedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const targetCol = this._boardColumns.columns().find(
      (c) => c.id.toLowerCase() === message.columnId.toLowerCase(),
    );

    this._boardColumns.updateColumnsLocally((cols) =>
      cols.filter((c) => c.id.toLowerCase() !== message.columnId.toLowerCase()),
    );

    this._boardDetail.updateBoardLocally((b) =>
      b
        ? {
            ...b,
            columns: (b.columns || []).filter(
              (c) => c.id.toLowerCase() !== message.columnId.toLowerCase(),
            ),
          }
        : null,
    );

    if (targetCol) {
      this.notifications.warning(`Cột "${targetCol.title}" đã được gỡ bỏ bởi thành viên khác.`);
    }
  }

  private handleRemoteCardCreated(message: CardCreatedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    // Kiểm tra xem thẻ đã tồn tại trong board chưa
    const currentCols = this._boardColumns.columns();
    const alreadyExists = currentCols.some((col) =>
      col.cards.some((c) => c.id.toLowerCase() === message.card.id.toLowerCase()),
    );
    if (alreadyExists) {
      return;
    }

    // Nếu là Scrum board có activeSprint: Thẻ tạo ra chỉ hiển thị trên bảng nếu nó thuộc activeSprint này
    if (currentBoard.activeSprint) {
      if (
        !message.card.sprintId ||
        message.card.sprintId.toLowerCase() !== currentBoard.activeSprint.id.toLowerCase()
      ) {
        return;
      }
    }

    const targetCol = currentCols.find(
      (c) => c.id.toLowerCase() === message.card.columnId.toLowerCase(),
    );
    if (!targetCol) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
      return;
    }

    const newCard: CardSummary = {
      ...message.card,
    };

    this._boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) =>
        col.id.toLowerCase() === message.card.columnId.toLowerCase()
          ? {
              ...col,
              cards: [...(col.cards || []), newCard].sort((a, b) => a.position - b.position),
            }
          : col,
      ),
    );

    const pts = newCard.storyPoints || 0;
    const isDone = !!newCard.isCompleted;

    this._boardDetail.updateBoardLocally((b) => {
      if (!b) return null;
      const updatedSprint =
        b.activeSprint &&
        (!newCard.sprintId || newCard.sprintId.toLowerCase() === b.activeSprint.id.toLowerCase())
          ? {
              ...b.activeSprint,
              totalCards: (b.activeSprint.totalCards || 0) + 1,
              completedCards: isDone
                ? (b.activeSprint.completedCards || 0) + 1
                : b.activeSprint.completedCards,
              totalStoryPoints: (b.activeSprint.totalStoryPoints || 0) + pts,
              completedStoryPoints: isDone
                ? (b.activeSprint.completedStoryPoints || 0) + pts
                : b.activeSprint.completedStoryPoints,
            }
          : b.activeSprint;

      return {
        ...b,
        activeSprint: updatedSprint,
        columns: this._boardColumns.columns(),
      };
    });

    this.notifications.info(`Thẻ "${newCard.title}" vừa được thêm bởi thành viên khác.`);
  }

  private handleRemoteCardUpdated(message: CardUpdatedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this._boardColumns.columns();
    let oldCard: CardSummary | null = null;
    let oldColumnId: string | null = null;

    for (const col of currentCols) {
      const found = col.cards.find((c) => c.id.toLowerCase() === message.card.id.toLowerCase());
      if (found) {
        oldCard = found;
        oldColumnId = col.id;
        break;
      }
    }

    if (!oldCard) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
      return;
    }

    const oldIsCompleted = !!oldCard.isCompleted;
    const newIsCompleted = !!message.card.isCompleted;
    const oldPts = oldCard.storyPoints || 0;
    const newPts = message.card.storyPoints || 0;
    const diffPts = newPts - oldPts;

    const completing = !oldIsCompleted && newIsCompleted;
    const uncompleting = oldIsCompleted && !newIsCompleted;

    const targetColumnId = message.card.columnId.toLowerCase();
    this._boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) => {
        const colId = col.id.toLowerCase();
        if (oldColumnId && colId === oldColumnId.toLowerCase() && colId !== targetColumnId) {
          return {
            ...col,
            cards: col.cards.filter((c) => c.id.toLowerCase() !== message.card.id.toLowerCase()),
          };
        }
        if (colId === targetColumnId) {
          const cardExists = col.cards.some(
            (c) => c.id.toLowerCase() === message.card.id.toLowerCase(),
          );
          if (cardExists) {
            return {
              ...col,
              cards: col.cards.map((c) =>
                c.id.toLowerCase() === message.card.id.toLowerCase()
                  ? { ...c, ...message.card }
                  : c,
              ),
            };
          } else {
            return {
              ...col,
              cards: [...col.cards, message.card].sort((a, b) => a.position - b.position),
            };
          }
        }
        return col;
      }),
    );

    this._boardDetail.updateBoardLocally((b) => {
      if (!b) return null;
      let updatedSprint = b.activeSprint;
      if (b.activeSprint && (completing || uncompleting || diffPts !== 0)) {
        let compCards = b.activeSprint.completedCards || 0;
        let compPts = b.activeSprint.completedStoryPoints || 0;
        let totPts = b.activeSprint.totalStoryPoints || 0;

        if (completing) {
          compCards += 1;
          compPts += newPts;
        } else if (uncompleting) {
          compCards = Math.max(0, compCards - 1);
          compPts = Math.max(0, compPts - oldPts);
        } else if (diffPts !== 0 && oldIsCompleted) {
          compPts = Math.max(0, compPts + diffPts);
        }

        if (diffPts !== 0) {
          totPts = Math.max(0, totPts + diffPts);
        }

        updatedSprint = {
          ...b.activeSprint,
          completedCards: compCards,
          completedStoryPoints: compPts,
          totalStoryPoints: totPts,
        };
      }

      return {
        ...b,
        activeSprint: updatedSprint,
        columns: this._boardColumns.columns(),
      };
    });

    if (this._cardDetail.currentCardDetail()?.id.toLowerCase() === message.card.id.toLowerCase()) {
      this._cardDetail.updateActiveCardLocally((detail) =>
        detail ? { ...detail, ...message.card } : null,
      );
    }

    if (completing || uncompleting) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    }

    this.notifications.info(`Thẻ "${message.card.title}" vừa được cập nhật bởi thành viên khác.`);
  }

  private handleRemoteCardDeleted(message: CardDeletedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    let deletedCard: CardSummary | null = null;
    for (const col of this._boardColumns.columns()) {
      const found = col.cards.find((c) => c.id.toLowerCase() === message.cardId.toLowerCase());
      if (found) {
        deletedCard = found;
        break;
      }
    }

    this._boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id.toLowerCase() !== message.cardId.toLowerCase()),
      })),
    );

    const pts = deletedCard?.storyPoints || 0;
    const isDone = !!deletedCard?.isCompleted;

    this._boardDetail.updateBoardLocally((b) => {
      if (!b) return null;
      const updatedSprint =
        b.activeSprint && deletedCard
          ? {
              ...b.activeSprint,
              totalCards: Math.max(0, (b.activeSprint.totalCards || 0) - 1),
              completedCards: isDone
                ? Math.max(0, (b.activeSprint.completedCards || 0) - 1)
                : b.activeSprint.completedCards,
              totalStoryPoints: Math.max(0, (b.activeSprint.totalStoryPoints || 0) - pts),
              completedStoryPoints: isDone
                ? Math.max(0, (b.activeSprint.completedStoryPoints || 0) - pts)
                : b.activeSprint.completedStoryPoints,
            }
          : b.activeSprint;

      return {
        ...b,
        activeSprint: updatedSprint,
        columns: this._boardColumns.columns(),
      };
    });

    if (this._cardDetail.currentCardDetail()?.id.toLowerCase() === message.cardId.toLowerCase()) {
      this.clearCardDetail();
      this.notifications.warning('Thẻ bạn đang xem vừa bị xoá bởi thành viên khác.');
    } else if (deletedCard) {
      this.notifications.warning(`Thẻ "${deletedCard.title}" vừa được xoá bởi thành viên khác.`);
    }
  }

  private handleRemoteColumnsReordered(message: ColumnsReorderedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    // Echo suppression: bỏ qua sự kiện nếu do chính user hiện tại thao tác (đã được cập nhật optimistic)
    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this._boardColumns.columns();
    if (!currentCols || currentCols.length === 0) {
      return;
    }

    const colMap = new Map<string, ColumnSummary>();
    for (const col of currentCols) {
      colMap.set(col.id.toLowerCase(), col);
    }

    const reordered: ColumnSummary[] = [];
    for (let i = 0; i < message.orderedColumnIds.length; i++) {
      const colId = message.orderedColumnIds[i].toLowerCase();
      const col = colMap.get(colId);
      if (col) {
        reordered.push({ ...col, position: i });
        colMap.delete(colId);
      }
    }

    // Giữ lại các cột nếu lỡ không có trong orderedColumnIds để tránh mất mát dữ liệu
    for (const remainingCol of colMap.values()) {
      reordered.push(remainingCol);
    }

    this._boardColumns.setColumns(reordered);
    this._boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: reordered } : null));

    this.notifications.warning('Thứ tự các danh sách vừa được cập nhật bởi thành viên khác.');
  }

  private handleRemoteCardMoved(message: CardMovedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    // Echo suppression: bỏ qua sự kiện nếu do chính user hiện tại thao tác (đã được cập nhật optimistic)
    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this._boardColumns.columns();
    if (!currentCols || currentCols.length === 0) {
      return;
    }

    // Tìm thẻ trên toàn bộ các cột hiện tại
    let existingCard: CardSummary | null = null;
    let foundSourceColId: string | null = null;

    for (const col of currentCols) {
      const found = col.cards.find((c) => c.id.toLowerCase() === message.cardId.toLowerCase());
      if (found) {
        existingCard = found;
        foundSourceColId = col.id;
        break;
      }
    }

    // Nếu thẻ không có trong state hiện tại (có thể mới tạo bởi người khác hoặc mất đồng bộ), tự động reload dữ liệu
    if (!existingCard) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
      return;
    }

    const sourceColId = foundSourceColId ?? message.sourceColumnId;
    const targetColId = message.targetColumnId;

    let wasCompleted = false;
    let isNowCompleted = false;
    let newIsCompleted = false;

    this._boardColumns.updateColumnsLocally((cols) => {
      const nextCols = cols.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      const sourceCol = nextCols.find((c) => c.id.toLowerCase() === sourceColId.toLowerCase());
      const targetCol = nextCols.find((c) => c.id.toLowerCase() === targetColId.toLowerCase());

      if (!sourceCol || !targetCol) {
        return cols;
      }

      const fromIndex = sourceCol.cards.findIndex(
        (c) => c.id.toLowerCase() === message.cardId.toLowerCase(),
      );
      if (fromIndex === -1) {
        return cols;
      }
      // splice trả về danh sách các phần tử bị cắt, nên dùng destructuring để lấy phần tử đầu tiên
      const [movedCard] = sourceCol.cards.splice(fromIndex, 1);

      newIsCompleted =
        message.isCompleted !== undefined
          ? message.isCompleted
          : targetCol.isDoneColumn
            ? true
            : !!movedCard.isCompleted;

      wasCompleted = !!movedCard.isCompleted;
      isNowCompleted = newIsCompleted;

      const updatedMovedCard: CardSummary = {
        ...movedCard,
        columnId: targetCol.id,
        isCompleted: newIsCompleted,
      };

      const clampedIndex = Math.max(0, Math.min(message.newPosition, targetCol.cards.length));
      targetCol.cards.splice(clampedIndex, 0, updatedMovedCard);

      // Cập nhật lại chỉ số position cho các thẻ ở cả 2 cột
      sourceCol.cards.forEach((c, idx) => {
        c.position = idx;
      });
      targetCol.cards.forEach((c, idx) => {
        c.position = idx;
      });

      return nextCols;
    });

    // Đồng bộ lại boardSignal và activeSprint
    this._boardDetail.updateBoardLocally((b) => {
      if (!b) return null;
      let updatedSprint = b.activeSprint;
      if (b.activeSprint && wasCompleted !== isNowCompleted) {
        const pts = existingCard.storyPoints || 0;
        let compCards = b.activeSprint.completedCards || 0;
        let compPts = b.activeSprint.completedStoryPoints || 0;

        if (!wasCompleted && isNowCompleted) {
          compCards += 1;
          compPts += pts;
        } else if (wasCompleted && !isNowCompleted) {
          compCards = Math.max(0, compCards - 1);
          compPts = Math.max(0, compPts - pts);
        }

        updatedSprint = {
          ...b.activeSprint,
          completedCards: compCards,
          completedStoryPoints: compPts,
        };
      }

      return {
        ...b,
        activeSprint: updatedSprint,
        columns: this._boardColumns.columns(),
      };
    });

    // Nếu modal chi tiết thẻ đang mở thẻ này, cập nhật lại columnId và isCompleted cho modal
    this._cardDetail.updateActiveCardLocally((detail) =>
      detail && detail.id.toLowerCase() === message.cardId.toLowerCase()
        ? { ...detail, columnId: targetColId, isCompleted: newIsCompleted }
        : detail,
    );

    const sourceColObj = currentCols.find((c) => c.id.toLowerCase() === sourceColId.toLowerCase());
    const targetColObj = currentCols.find((c) => c.id.toLowerCase() === targetColId.toLowerCase());
    if (sourceColObj?.isDoneColumn !== targetColObj?.isDoneColumn || wasCompleted !== isNowCompleted) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    }

    this.notifications.warning(
      `Thẻ "${existingCard.title}" vừa được di chuyển bởi thành viên khác.`,
    );
  }

  private handleRemoteSprintStarted(message: SprintStartedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    this.notifications.info(`Sprint "${message.sprint.name}" vừa được kích hoạt bởi thành viên khác.`);
  }

  private handleRemoteSprintUpdated(message: SprintUpdatedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    if (currentBoard.activeSprint?.id.toLowerCase() === message.sprint.id.toLowerCase()) {
      this._boardDetail.updateBoardLocally((b) =>
        b?.activeSprint?.id.toLowerCase() === message.sprint.id.toLowerCase()
          ? {
              ...b,
              activeSprint: {
                ...b.activeSprint,
                name: message.sprint.name,
                goal: message.sprint.goal,
                startDate: message.sprint.startDate,
                endDate: message.sprint.endDate,
              },
            }
          : b,
      );
      this.notifications.info(`Thông tin Sprint "${message.sprint.name}" vừa được cập nhật.`);
    }
  }

  private handleRemoteSprintCompleted(message: SprintCompletedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    this.notifications.info('Sprint hiện tại vừa được hoàn thành bởi thành viên khác.');
  }

  private handleRemoteSprintDeleted(message: SprintDeletedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    if (currentBoard.activeSprint?.id.toLowerCase() === message.sprintId.toLowerCase()) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
      this.notifications.warning('Sprint hiện tại vừa bị xoá bởi thành viên khác.');
    }
  }

  private handleRemoteCardSprintChanged(message: CardSprintChangedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const activeSprintId = currentBoard.activeSprint?.id.toLowerCase();
    const oldSprintId = message.oldSprintId?.toLowerCase();
    const newSprintId = message.newSprintId?.toLowerCase();

    // TH1: Thẻ được đưa VÀO activeSprint của board hiện tại
    if (activeSprintId && newSprintId === activeSprintId && oldSprintId !== activeSprintId) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
      this.notifications.info(`Thẻ "${message.card.title}" vừa được thêm vào Sprint hiện tại.`);
      return;
    }

    // TH2: Thẻ bị đưa RA KHỎI activeSprint của board hiện tại
    if (activeSprintId && oldSprintId === activeSprintId && newSprintId !== activeSprintId) {
      this._boardColumns.updateColumnsLocally((cols) =>
        cols.map((col) => ({
          ...col,
          cards: (col.cards || []).filter((c) => c.id.toLowerCase() !== message.card.id.toLowerCase()),
        })),
      );

      const pts = message.card.storyPoints || 0;
      const isDone = !!message.card.isCompleted;
      this._boardDetail.updateBoardLocally((b) => {
        if (!b?.activeSprint) return b;
        return {
          ...b,
          activeSprint: {
            ...b.activeSprint,
            totalCards: Math.max(0, (b.activeSprint.totalCards || 0) - 1),
            completedCards: isDone
              ? Math.max(0, (b.activeSprint.completedCards || 0) - 1)
              : b.activeSprint.completedCards,
            totalStoryPoints: Math.max(0, (b.activeSprint.totalStoryPoints || 0) - pts),
            completedStoryPoints: isDone
              ? Math.max(0, (b.activeSprint.completedStoryPoints || 0) - pts)
              : b.activeSprint.completedStoryPoints,
          },
          columns: this._boardColumns.columns(),
        };
      });

      if (this._cardDetail.currentCardDetail()?.id.toLowerCase() === message.card.id.toLowerCase()) {
        this._cardDetail.updateActiveCardLocally((detail) =>
          detail ? { ...detail, sprintId: message.newSprintId } : null,
        );
      }

      this.notifications.warning(`Thẻ "${message.card.title}" vừa được chuyển ra khỏi Sprint này.`);
      return;
    }

    // TH3: Nếu modal chi tiết đang mở xem thẻ này, cập nhật lại sprintId
    if (this._cardDetail.currentCardDetail()?.id.toLowerCase() === message.card.id.toLowerCase()) {
      this._cardDetail.updateActiveCardLocally((detail) =>
        detail ? { ...detail, sprintId: message.newSprintId } : null,
      );
    }
  }

  private handleRemoteCardDependencyChanged(
    boardId: string,
    blockedCardId: string,
    blockingCardId: string,
  ): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (currentBoard && currentBoard.id.toLowerCase() === boardId.toLowerCase()) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    }
    const currentDetail = this._cardDetail.currentCardDetail();
    if (
      currentDetail &&
      (currentDetail.id.toLowerCase() === blockedCardId.toLowerCase() ||
        currentDetail.id.toLowerCase() === blockingCardId.toLowerCase())
    ) {
      this.loadCardDetail(currentDetail.id);
    }
  }

  private handleRemoteCardCommentAdded(message: CardCommentAddedMessage): void {
    const currentBoard = this._boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const applied = this._cardDetail.applyIncomingCardComment(message.comment);
    if (!applied) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    const isOwnAction =
      Boolean(message.changedByUserId) &&
      Boolean(currentUserId) &&
      message.changedByUserId.toLowerCase() === currentUserId!.toLowerCase();

    const isViewingThisCard =
      this._cardDetail.currentCardDetail()?.id.toLowerCase() === message.comment.cardId.toLowerCase();

    if (!isOwnAction && !isViewingThisCard) {
      let cardTitle = '';
      for (const col of this._boardColumns.columns()) {
        const found = col.cards.find(
          (c) => c.id.toLowerCase() === message.comment.cardId.toLowerCase(),
        );
        if (found) {
          cardTitle = found.title;
          break;
        }
      }
      const cardLabel = cardTitle ? ` trong thẻ "${cardTitle}"` : '';
      this.notifications.info(`${message.comment.username} vừa bình luận${cardLabel}.`);
    }
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
