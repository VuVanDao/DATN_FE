import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CardSummary, ColumnSummary, CreateCardRequest } from '../../../domain/models/board-detail.model';
import { CreateCardUseCase } from '../../board/create-card.use-case';
import { DeleteCardUseCase } from '../../board/delete-card.use-case';
import { MoveCardUseCase } from '../../board/move-card.use-case';
import { UpdateCardUseCase } from '../../board/update-card.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';

/**
 * Slice quản lý các thẻ (Card) trên các cột Kanban.
 * Đảm nhiệm: tạo thẻ, kéo thả thẻ (trong cột hoặc sang cột khác), chuyển cột nhanh,
 * đổi tiêu đề nhanh, và xoá thẻ.
 */
@Injectable({
  providedIn: 'root',
})
export class BoardCardsSlice {
  private readonly createCardUseCase = inject(CreateCardUseCase);
  private readonly moveCardUseCase = inject(MoveCardUseCase);
  private readonly updateCardUseCase = inject(UpdateCardUseCase);
  private readonly deleteCardUseCase = inject(DeleteCardUseCase);
  private readonly boardColumns = inject(BoardColumnsSlice);
  private readonly boardDetail = inject(BoardDetailSlice);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();

  private readonly isAddingCardSignal = signal<boolean>(false);

  readonly isAddingCard = this.isAddingCardSignal.asReadonly();

  createCard(
    columnId: string,
    title: string,
    description?: string,
    sprintId?: string | null,
    onSuccess?: (card: CardSummary) => void,
    onError?: (error: string) => void,
  ): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || this.isAddingCardSignal()) return;

    const request: CreateCardRequest = {
      columnId,
      title: trimmedTitle,
      description,
      sprintId: sprintId ?? undefined,
    };

    this.requests.run({
      loading: this.isAddingCardSignal,
      request$: this.createCardUseCase.execute(request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo thẻ thất bại.',
      onError: (err) => {
        onError?.(err);
      },
      onSuccess: (newCard) => {
        const pts = newCard.storyPoints || 0;
        const isDone = !!newCard.isCompleted;

        this.boardColumns.updateColumnsLocally((cols) =>
          cols.map((col) =>
            col.id === columnId ? { ...col, cards: [...(col.cards || []), newCard] } : col,
          ),
        );
        this.boardDetail.updateBoardLocally((b) => {
          if (!b) return null;
          const updatedSprint =
            b.activeSprint && (!newCard.sprintId || newCard.sprintId === b.activeSprint.id)
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
            columns: (b.columns || []).map((col) =>
              col.id === columnId ? { ...col, cards: [...(col.cards || []), newCard] } : col,
            ),
          };
        });
        this.notifications.success('Đã tạo thẻ mới');
        onSuccess?.(newCard);
      },
    });
  }

  moveCard(
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    previousIndex: number,
    currentIndex: number,
    onCardMoved?: (cardId: string, targetColumnId: string, isCompleted: boolean) => void,
    onStatusChanged?: () => void,
  ): void {
    const currentCols = this.boardColumns.columns();
    const sourceCol = currentCols.find((c) => c.id === sourceColumnId);
    const targetCol = currentCols.find((c) => c.id === targetColumnId);
    const movingCard = sourceCol?.cards?.find((c) => c.id === cardId);

    // Nếu chuyển sang cột Hoàn thành mà thẻ đang bị chặn -> chặn ngay trên UI!
    if (targetCol?.isDoneColumn && movingCard?.isBlocked) {
      this.notifications.error(
        `Không thể chuyển thẻ "${movingCard.title}" vào cột "${targetCol.title}" vì đang bị chặn bởi công việc khác chưa hoàn thành.`,
      );
      return;
    }

    const previousCols = JSON.parse(JSON.stringify(this.boardColumns.columns())) as ColumnSummary[];

    // Thực hiện di chuyển optimistic trên UI
    this.boardColumns.updateColumnsLocally((cols) => {
      const nextCols = cols.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      const source = nextCols.find((c) => c.id === sourceColumnId);
      const target = nextCols.find((c) => c.id === targetColumnId);

      if (!source || !target) return cols;

      if (sourceColumnId === targetColumnId) {
        moveItemInArray(source.cards, previousIndex, currentIndex);
      } else {
        transferArrayItem(source.cards, target.cards, previousIndex, currentIndex);
        // Cập nhật columnId & tiến độ hoàn thành 2 chiều cho card chuyển sang
        const movedCard = target.cards[currentIndex];
        if (movedCard) {
          movedCard.columnId = targetColumnId;
          const pts = movedCard.storyPoints ?? 0;

          if (target.isDoneColumn) {
            const wasCompleted = !!movedCard.isCompleted;
            movedCard.isCompleted = true;
            // Cập nhật thống kê activeSprint trên header nếu thẻ trước đó chưa hoàn thành
            if (!wasCompleted) {
              this.boardDetail.updateBoardLocally((b) => {
                if (!b?.activeSprint) return b;
                return {
                  ...b,
                  activeSprint: {
                    ...b.activeSprint,
                    completedCards: (b.activeSprint.completedCards || 0) + 1,
                    completedStoryPoints: (b.activeSprint.completedStoryPoints || 0) + pts,
                  },
                };
              });
            }
          } else if (source.isDoneColumn) {
            const wasCompleted = !!movedCard.isCompleted;
            movedCard.isCompleted = false;
            // Trừ thống kê activeSprint trên header nếu thẻ trước đó đã hoàn thành
            if (wasCompleted) {
              this.boardDetail.updateBoardLocally((b) => {
                if (!b?.activeSprint) return b;
                return {
                  ...b,
                  activeSprint: {
                    ...b.activeSprint,
                    completedCards: Math.max(0, (b.activeSprint.completedCards || 0) - 1),
                    completedStoryPoints: Math.max(0, (b.activeSprint.completedStoryPoints || 0) - pts),
                  },
                };
              });
            }
          }
        }
      }

      return nextCols;
    });

    const isSourceDone = sourceCol?.isDoneColumn ?? false;
    const isTargetDone = targetCol?.isDoneColumn ?? false;
    let newIsCompleted = movingCard?.isCompleted ?? false;
    if (isTargetDone) {
      newIsCompleted = true;
    } else if (isSourceDone) {
      newIsCompleted = false;
    }

    onCardMoved?.(cardId, targetColumnId, newIsCompleted);

    this.moveCardUseCase
      .execute(cardId, {
        targetColumnId,
        newPosition: currentIndex,
      })
      .subscribe({
        next: () => {
          if (isSourceDone !== isTargetDone) {
            onStatusChanged?.();
          }
        },
        error: (err) => {
          // Rollback khi lỗi
          this.boardColumns.setColumns(previousCols);
          const errorMsg =
            err?.error?.message ||
            err?.message ||
            'Không thể di chuyển thẻ. Đã khôi phục lại vị trí.';
          this.notifications.error(errorMsg);
        },
      });
  }

  moveCardToColumn(
    cardId: string,
    targetColumnId: string,
    onSuccess?: () => void,
    onCardMoved?: (cardId: string, targetColumnId: string, isCompleted: boolean) => void,
    onStatusChanged?: () => void,
  ): void {
    const cols = this.boardColumns.columns();
    const sourceCol = cols.find((col) => col.cards.some((c) => c.id === cardId));
    const targetCol = cols.find((col) => col.id === targetColumnId);

    if (!sourceCol || !targetCol || sourceCol.id === targetColumnId) {
      return;
    }

    const previousIndex = sourceCol.cards.findIndex((c) => c.id === cardId);
    const targetIndex = targetCol.cards.length;

    this.moveCard(
      cardId,
      sourceCol.id,
      targetColumnId,
      previousIndex,
      targetIndex,
      onCardMoved,
      onStatusChanged,
    );
    this.notifications.success(`Đã chuyển thẻ sang cột "${targetCol.title}"`);
    onSuccess?.();
  }

  updateCardTitle(cardId: string, columnId: string, title: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const previousCols = this.boardColumns.columns();
    this.boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.map((card) =>
                card.id === cardId ? { ...card, title: trimmedTitle } : card,
              ),
            }
          : col,
      ),
    );

    this.updateCardUseCase.execute(cardId, { title: trimmedTitle }).subscribe({
      next: () => {
        this.notifications.success('Đã cập nhật tiêu đề thẻ');
      },
      error: () => {
        this.boardColumns.setColumns(previousCols);
        this.notifications.error('Không thể cập nhật thẻ. Vui lòng thử lại.');
      },
    });
  }

  deleteCard(cardId: string, columnId: string, onCardDeleted?: (cardId: string) => void): void {
    let deletedCard: CardSummary | null = null;
    for (const col of this.boardColumns.columns()) {
      const found = col.cards.find((c) => c.id === cardId);
      if (found) {
        deletedCard = found;
        break;
      }
    }

    this.deleteCardUseCase.execute(cardId).subscribe({
      next: () => {
        const pts = deletedCard?.storyPoints || 0;
        const isDone = !!deletedCard?.isCompleted;

        this.boardColumns.updateColumnsLocally((cols) =>
          cols.map((col) =>
            col.id === columnId
              ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
              : col,
          ),
        );
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
            columns: (b.columns || []).map((col) =>
              col.id === columnId
                ? { ...col, cards: (col.cards || []).filter((card) => card.id !== cardId) }
                : col,
            ),
          };
        });
        onCardDeleted?.(cardId);
        this.notifications.success('Đã xoá thẻ thành công');
      },
      error: () => {
        this.notifications.error('Không thể xoá thẻ. Vui lòng thử lại.');
      },
    });
  }

  removeCardLocally(cardId: string): void {
    this.boardColumns.updateColumnsLocally((cols) =>
      cols.map((col) => ({
        ...col,
        cards: (col.cards || []).filter((card) => card.id !== cardId),
      })),
    );
    this.boardDetail.updateBoardLocally((b) =>
      b
        ? {
            ...b,
            columns: (b.columns || []).map((col) => ({
              ...col,
              cards: (col.cards || []).filter((card) => card.id !== cardId),
            })),
          }
        : null,
    );
  }

  clear(): void {
    this.cancel$.next();
    this.isAddingCardSignal.set(false);
  }
}
