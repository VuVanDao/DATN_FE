import { inject, Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CardSummary, ColumnSummary } from '../../../domain/models/board-detail.model';
import {
  CardCommentAddedMessage,
  CardCreatedMessage,
  CardDeletedMessage,
  CardMovedMessage,
  CardSprintChangedMessage,
  CardUpdatedMessage,
  ColumnCreatedMessage,
  ColumnDeletedMessage,
  ColumnsReorderedMessage,
  ColumnUpdatedMessage,
  SprintCompletedMessage,
  SprintDeletedMessage,
  SprintStartedMessage,
  SprintUpdatedMessage,
} from '../../../domain/models/board-realtime.model';
import { BoardRealtimeService } from '../../../infrastructure/realtime/board-realtime.service';
import { NotificationService } from '../../shared/notification.service';
import { AuthStore } from '../auth.store';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';
import { CardDetailSlice } from './card-detail.slice';

@Injectable({
  providedIn: 'root',
})
export class BoardRealtimeSlice {
  private readonly boardRealtimeService = inject(BoardRealtimeService);
  private readonly authStore = inject(AuthStore);
  private readonly boardDetail = inject(BoardDetailSlice);
  private readonly boardColumns = inject(BoardColumnsSlice);
  private readonly cardDetail = inject(CardDetailSlice);
  private readonly notifications = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.setupRealtimeListeners();
  }

  joinBoard(boardId: string): void {
    this.boardRealtimeService?.joinBoard(boardId);
  }

  leaveBoard(boardId: string): void {
    this.boardRealtimeService?.leaveBoard(boardId);
  }

  stopConnection(): void {
    this.boardRealtimeService?.stopConnection();
  }

  destroy(): void {
    this.destroy$.next();
  }

  silentReloadBoard(slug: string, projectId: string): void {
    this.boardDetail.silentReloadBoard(slug, projectId, (board) => {
      this.boardColumns.setColumns(board.columns || []);
    });
  }

  private setupRealtimeListeners(): void {
    this.boardRealtimeService?.columnsReordered$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteColumnsReordered(message),
      });

    this.boardRealtimeService?.cardMoved$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteCardMoved(message),
      });

    this.boardRealtimeService?.columnCreated$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteColumnCreated(message),
      });

    this.boardRealtimeService?.columnUpdated$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteColumnUpdated(message),
      });

    this.boardRealtimeService?.columnDeleted$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteColumnDeleted(message),
      });

    this.boardRealtimeService?.cardCreated$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteCardCreated(message),
      });

    this.boardRealtimeService?.cardUpdated$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteCardUpdated(message),
      });

    this.boardRealtimeService?.cardDeleted$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteCardDeleted(message),
      });

    this.boardRealtimeService?.sprintStarted$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteSprintStarted(message),
      });

    this.boardRealtimeService?.sprintUpdated$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteSprintUpdated(message),
      });

    this.boardRealtimeService?.sprintCompleted$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteSprintCompleted(message),
      });

    this.boardRealtimeService?.sprintDeleted$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteSprintDeleted(message),
      });

    this.boardRealtimeService?.cardSprintChanged$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteCardSprintChanged(message),
      });

    this.boardRealtimeService?.cardDependencyAdded$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) =>
          this.handleRemoteCardDependencyChanged(
            message.boardId,
            message.blockedCardId,
            message.blockingCardId,
          ),
      });

    this.boardRealtimeService?.cardDependencyRemoved$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) =>
          this.handleRemoteCardDependencyChanged(
            message.boardId,
            message.blockedCardId,
            message.blockingCardId,
          ),
      });

    this.boardRealtimeService?.cardCommentAdded$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => this.handleRemoteCardCommentAdded(message),
      });

    this.boardRealtimeService?.reconnected$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const currentBoard = this.boardDetail.currentBoard();
          if (currentBoard) {
            this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
          }
        },
      });

    this.authStore?.ended$
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.boardRealtimeService?.stopConnection();
        },
      });
  }

  private handleRemoteColumnCreated(message: ColumnCreatedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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

    const currentCols = this.boardColumns.columns();
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
    this.boardColumns.setColumns(nextCols);
    this.boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: nextCols } : null));
    this.notifications.info(`Cột "${message.title}" vừa được thêm bởi thành viên khác.`);
  }

  private handleRemoteColumnUpdated(message: ColumnUpdatedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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

    this.boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) =>
        col.id.toLowerCase() === message.columnId.toLowerCase()
          ? {
              ...col,
              title: message.title,
              isDoneColumn: message.isDoneColumn,
              position: message.position,
              cards: (col.cards || []).map((card) => ({
                ...card,
                isCompleted: message.isDoneColumn,
              })),
            }
          : col,
      ),
    );

    this.boardDetail.updateBoardLocally((b) =>
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
                    cards: (col.cards || []).map((card) => ({
                      ...card,
                      isCompleted: message.isDoneColumn,
                    })),
                  }
                : col,
            ),
          }
        : null,
    );
  }

  private handleRemoteColumnDeleted(message: ColumnDeletedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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

    const targetCol = this.boardColumns.columns().find(
      (c) => c.id.toLowerCase() === message.columnId.toLowerCase(),
    );

    this.boardColumns.updateColumnsLocally((cols) =>
      cols.filter((c) => c.id.toLowerCase() !== message.columnId.toLowerCase()),
    );

    this.boardDetail.updateBoardLocally((b) =>
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
    const currentBoard = this.boardDetail.currentBoard();
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
    const currentCols = this.boardColumns.columns();
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

    this.boardColumns.updateColumnsLocally((cols) =>
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

    this.boardDetail.updateBoardLocally((b) => {
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
        columns: this.boardColumns.columns(),
      };
    });

    this.notifications.info(`Thẻ "${newCard.title}" vừa được thêm bởi thành viên khác.`);
  }

  private handleRemoteCardUpdated(message: CardUpdatedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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

    const currentCols = this.boardColumns.columns();
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
    this.boardColumns.updateColumnsLocally((cols) =>
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

    this.boardDetail.updateBoardLocally((b) => {
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
        columns: this.boardColumns.columns(),
      };
    });

    if (this.cardDetail.currentCardDetail()?.id.toLowerCase() === message.card.id.toLowerCase()) {
      this.cardDetail.updateActiveCardLocally((detail) =>
        detail ? { ...detail, ...message.card } : null,
      );
    }

    if (completing || uncompleting) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    }

    this.notifications.info(`Thẻ "${message.card.title}" vừa được cập nhật bởi thành viên khác.`);
  }

  private handleRemoteCardDeleted(message: CardDeletedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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
    for (const col of this.boardColumns.columns()) {
      const found = col.cards.find((c) => c.id.toLowerCase() === message.cardId.toLowerCase());
      if (found) {
        deletedCard = found;
        break;
      }
    }

    this.boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id.toLowerCase() !== message.cardId.toLowerCase()),
      })),
    );

    const pts = deletedCard?.storyPoints || 0;
    const isDone = !!deletedCard?.isCompleted;

    this.boardDetail.updateBoardLocally((b) => {
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
        columns: this.boardColumns.columns(),
      };
    });

    if (this.cardDetail.currentCardDetail()?.id.toLowerCase() === message.cardId.toLowerCase()) {
      this.cardDetail.clearCardDetail();
      this.notifications.warning('Thẻ bạn đang xem vừa bị xoá bởi thành viên khác.');
    } else if (deletedCard) {
      this.notifications.warning(`Thẻ "${deletedCard.title}" vừa được xoá bởi thành viên khác.`);
    }
  }

  private handleRemoteColumnsReordered(message: ColumnsReorderedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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

    const currentCols = this.boardColumns.columns();
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

    this.boardColumns.setColumns(reordered);
    this.boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: reordered } : null));

    this.notifications.warning('Thứ tự các danh sách vừa được cập nhật bởi thành viên khác.');
  }

  private handleRemoteCardMoved(message: CardMovedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
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

    const currentCols = this.boardColumns.columns();
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

    this.boardColumns.updateColumnsLocally((cols) => {
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
    this.boardDetail.updateBoardLocally((b) => {
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
        columns: this.boardColumns.columns(),
      };
    });

    // Nếu modal chi tiết thẻ đang mở thẻ này, cập nhật lại columnId và isCompleted cho modal
    this.cardDetail.updateActiveCardLocally((detail) =>
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
    const currentBoard = this.boardDetail.currentBoard();
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
    const currentBoard = this.boardDetail.currentBoard();
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
      this.boardDetail.updateBoardLocally((b) =>
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
    const currentBoard = this.boardDetail.currentBoard();
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
    const currentBoard = this.boardDetail.currentBoard();
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
    const currentBoard = this.boardDetail.currentBoard();
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
      this.boardColumns.updateColumnsLocally((cols) =>
        cols.map((col) => ({
          ...col,
          cards: (col.cards || []).filter((c) => c.id.toLowerCase() !== message.card.id.toLowerCase()),
        })),
      );

      const pts = message.card.storyPoints || 0;
      const isDone = !!message.card.isCompleted;
      this.boardDetail.updateBoardLocally((b) => {
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
          columns: this.boardColumns.columns(),
        };
      });

      if (this.cardDetail.currentCardDetail()?.id.toLowerCase() === message.card.id.toLowerCase()) {
        this.cardDetail.updateActiveCardLocally((detail) =>
          detail ? { ...detail, sprintId: message.newSprintId } : null,
        );
      }

      this.notifications.warning(`Thẻ "${message.card.title}" vừa được chuyển ra khỏi Sprint này.`);
      return;
    }

    // TH3: Nếu modal chi tiết đang mở xem thẻ này, cập nhật lại sprintId
    if (this.cardDetail.currentCardDetail()?.id.toLowerCase() === message.card.id.toLowerCase()) {
      this.cardDetail.updateActiveCardLocally((detail) =>
        detail ? { ...detail, sprintId: message.newSprintId } : null,
      );
    }
  }

  private handleRemoteCardDependencyChanged(
    boardId: string,
    blockedCardId: string,
    blockingCardId: string,
  ): void {
    const currentBoard = this.boardDetail.currentBoard();
    if (currentBoard && currentBoard.id.toLowerCase() === boardId.toLowerCase()) {
      this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
    }
    const currentDetail = this.cardDetail.currentCardDetail();
    if (
      currentDetail &&
      (currentDetail.id.toLowerCase() === blockedCardId.toLowerCase() ||
        currentDetail.id.toLowerCase() === blockingCardId.toLowerCase())
    ) {
      this.cardDetail.loadCardDetail(currentDetail.id);
    }
  }

  private handleRemoteCardCommentAdded(message: CardCommentAddedMessage): void {
    const currentBoard = this.boardDetail.currentBoard();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const applied = this.cardDetail.applyIncomingCardComment(message.comment);
    if (!applied) {
      return;
    }

    const currentUserId = this.authStore?.currentUser?.()?.id;
    const isOwnAction =
      Boolean(message.changedByUserId) &&
      Boolean(currentUserId) &&
      message.changedByUserId.toLowerCase() === currentUserId!.toLowerCase();

    const isViewingThisCard =
      this.cardDetail.currentCardDetail()?.id.toLowerCase() === message.comment.cardId.toLowerCase();

    if (!isOwnAction && !isViewingThisCard) {
      let cardTitle = '';
      for (const col of this.boardColumns.columns()) {
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
}
