import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import {
  BoardDetail,
  CardComment,
  CardDetail,
  CardSummary,
  ColumnSummary,
  CreateCardRequest,
  UpdateCardRequest,
} from '../../domain/models/board-detail.model';
import { Board, MyBoards, UpdateBoardRequest } from '../../domain/models/project.model';
import { AddCardCommentUseCase } from '../board/add-card-comment.use-case';
import { CreateCardUseCase } from '../board/create-card.use-case';
import { CreateColumnUseCase } from '../board/create-column.use-case';
import { DeleteBoardUseCase } from '../board/delete-board.use-case';
import { DeleteCardUseCase } from '../board/delete-card.use-case';
import { DeleteColumnUseCase } from '../board/delete-column.use-case';
import { GetBoardDetailUseCase } from '../board/get-board-detail.use-case';
import { GetCardDetailUseCase } from '../board/get-card-detail.use-case';
import { GetMyBoardsUseCase } from '../board/get-my-boards.use-case';
import { MoveCardUseCase } from '../board/move-card.use-case';
import { ReorderColumnsUseCase } from '../board/reorder-columns.use-case';
import { UpdateBoardPreferenceUseCase } from '../board/update-board-preference.use-case';
import { UpdateBoardUseCase } from '../board/update-board.use-case';
import { UpdateCardUseCase } from '../board/update-card.use-case';
import { UpdateColumnUseCase } from '../board/update-column.use-case';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly getBoardDetailUseCase = inject(GetBoardDetailUseCase);
  private readonly getCardDetailUseCase = inject(GetCardDetailUseCase);
  private readonly addCardCommentUseCase = inject(AddCardCommentUseCase);
  private readonly createColumnUseCase = inject(CreateColumnUseCase);
  private readonly updateColumnUseCase = inject(UpdateColumnUseCase);
  private readonly deleteColumnUseCase = inject(DeleteColumnUseCase);
  private readonly reorderColumnsUseCase = inject(ReorderColumnsUseCase);
  private readonly createCardUseCase = inject(CreateCardUseCase);
  private readonly moveCardUseCase = inject(MoveCardUseCase);
  private readonly updateCardUseCase = inject(UpdateCardUseCase);
  private readonly deleteCardUseCase = inject(DeleteCardUseCase);
  private readonly deleteBoardUseCase = inject(DeleteBoardUseCase);
  private readonly updateBoardPreferenceUseCase = inject(UpdateBoardPreferenceUseCase);
  private readonly updateBoardUseCase = inject(UpdateBoardUseCase);
  private readonly getMyBoardsUseCase = inject(GetMyBoardsUseCase);

  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();

  private readonly boardSignal = signal<BoardDetail | null>(null);
  private readonly columnsSignal = signal<ColumnSummary[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly isAddingColumnSignal = signal<boolean>(false);
  private readonly isAddingCardSignal = signal<boolean>(false);
  private readonly isUpdatingBoardSignal = signal<boolean>(false);
  private readonly isDeletingBoardSignal = signal<boolean>(false);

  private readonly myBoardsSignal = signal<MyBoards>({ recentBoards: [], pinnedBoards: [] });
  private readonly isLoadingMyBoardsSignal = signal<boolean>(false);

  private readonly cardDetailSignal = signal<CardDetail | null>(null);
  private readonly isLoadingCardDetailSignal = signal<boolean>(false);

  readonly currentBoard = this.boardSignal.asReadonly();
  readonly columns = this.columnsSignal.asReadonly();
  readonly currentCardDetail = this.cardDetailSignal.asReadonly();
  readonly isLoadingCardDetail = this.isLoadingCardDetailSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAddingColumn = this.isAddingColumnSignal.asReadonly();
  readonly isAddingCard = this.isAddingCardSignal.asReadonly();
  readonly isUpdatingBoard = this.isUpdatingBoardSignal.asReadonly();
  readonly isDeletingBoard = this.isDeletingBoardSignal.asReadonly();
  readonly myBoards = this.myBoardsSignal.asReadonly();
  readonly isLoadingMyBoards = this.isLoadingMyBoardsSignal.asReadonly();

  loadBoard(slug: string, projectId: string, onSuccess?: (board: BoardDetail) => void): void {
    this.cancel$.next();
    this.errorSignal.set(null);

    this.requests.run({
      loading: this.loadingSignal,
      request$: this.getBoardDetailUseCase.execute(slug, projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải thông tin bảng.',
      toastOnError: false,
      onSuccess: (board) => {
        this.boardSignal.set(board);
        this.columnsSignal.set(board.columns || []);
        onSuccess?.(board);
      },
      onError: (err) => {
        this.errorSignal.set(err);
      },
    });
  }

  createColumn(boardId: string, title: string, isDoneColumn = false, onSuccess?: () => void): void {
    if (!title.trim() || this.isAddingColumnSignal()) return;

    this.requests.run({
      loading: this.isAddingColumnSignal,
      request$: this.createColumnUseCase.execute(boardId, {
        title: title.trim(),
        isDoneColumn,
      }),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo cột mới thất bại.',
      onSuccess: (newColumn) => {
        // Cột mới từ API chưa có cards -> gán mảng rỗng
        const colWithCards: ColumnSummary = {
          ...newColumn,
          cards: newColumn.cards || [],
        };
        this.columnsSignal.update((cols) => [...cols, colWithCards]);
        this.boardSignal.update((b) =>
          b ? { ...b, columns: [...(b.columns || []), colWithCards] } : null,
        );
        this.notifications.success(`Đã thêm danh sách "${colWithCards.title}"`);
        onSuccess?.();
      },
    });
  }

  updateColumn(
    columnId: string,
    title: string,
    isDoneColumn?: boolean,
    onSuccess?: () => void,
    onError?: (error: string) => void,
  ): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const board = this.boardSignal();
    if (!board) return;

    const existingCol = this.columnsSignal().find((c) => c.id === columnId);
    if (!existingCol) return;

    const finalIsDone = isDoneColumn ?? existingCol.isDoneColumn;

    if (existingCol.title === trimmedTitle && existingCol.isDoneColumn === finalIsDone) {
      onSuccess?.();
      return;
    }

    const previousTitle = existingCol.title;
    const previousIsDone = existingCol.isDoneColumn;

    this.columnsSignal.update((cols) =>
      cols.map((c) =>
        c.id === columnId ? { ...c, title: trimmedTitle, isDoneColumn: finalIsDone } : c,
      ),
    );
    this.boardSignal.update((b) =>
      b
        ? {
            ...b,
            columns: (b.columns || []).map((c) =>
              c.id === columnId ? { ...c, title: trimmedTitle, isDoneColumn: finalIsDone } : c,
            ),
          }
        : null,
    );

    this.updateColumnUseCase
      .execute(board.id, columnId, {
        title: trimmedTitle,
        isDoneColumn: finalIsDone,
      })
      .subscribe({
        next: (updatedCol) => {
          this.columnsSignal.update((cols) =>
            cols.map((c) =>
              c.id === columnId
                ? {
                    ...c,
                    title: updatedCol.title,
                    isDoneColumn: updatedCol.isDoneColumn,
                  }
                : c,
            ),
          );
          if (finalIsDone !== previousIsDone) {
            this.notifications.success(
              finalIsDone
                ? `Đã đánh dấu cột "${updatedCol.title}" là hoàn thành.`
                : `Đã bỏ đánh dấu hoàn thành cột "${updatedCol.title}".`,
            );
          }
          onSuccess?.();
        },
        error: (err) => {
          // Rollback khi lỗi
          this.columnsSignal.update((cols) =>
            cols.map((c) =>
              c.id === columnId ? { ...c, title: previousTitle, isDoneColumn: previousIsDone } : c,
            ),
          );
          this.boardSignal.update((b) =>
            b
              ? {
                  ...b,
                  columns: (b.columns || []).map((c) =>
                    c.id === columnId
                      ? { ...c, title: previousTitle, isDoneColumn: previousIsDone }
                      : c,
                  ),
                }
              : null,
          );
          const errorMsg =
            finalIsDone !== previousIsDone
              ? 'Không thể cập nhật trạng thái hoàn thành của cột.'
              : 'Không thể cập nhật tên cột.';
          this.notifications.error(errorMsg);
          onError?.(err?.message || errorMsg);
        },
      });
  }

  deleteColumn(columnId: string, onSuccess?: () => void, onError?: (error: string) => void): void {
    const board = this.boardSignal();
    if (!board) return;

    const existingCol = this.columnsSignal().find((c) => c.id === columnId);
    if (!existingCol) return;

    const previousCols = [...this.columnsSignal()];
    const previousBoardCols = board.columns ? [...board.columns] : [];

    // Cập nhật giao diện ngay lập tức (optimistic)
    this.columnsSignal.update((cols) => cols.filter((c) => c.id !== columnId));
    this.boardSignal.update((b) =>
      b ? { ...b, columns: (b.columns || []).filter((c) => c.id !== columnId) } : null,
    );

    this.deleteColumnUseCase.execute(board.id, columnId).subscribe({
      next: () => {
        this.notifications.success(`Đã xoá cột "${existingCol.title}" thành công.`);
        onSuccess?.();
      },
      error: (err) => {
        // Rollback nếu thất bại
        this.columnsSignal.set(previousCols);
        this.boardSignal.update((b) => (b ? { ...b, columns: previousBoardCols } : null));
        const errorMsg =
          err?.error?.message || err?.message || 'Không thể xoá cột. Vui lòng thử lại.';
        this.notifications.error(errorMsg);
        onError?.(errorMsg);
      },
    });
  }

  reorderColumns(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;

    const previousCols = [...this.columnsSignal()];
    const reordered = [...previousCols];
    moveItemInArray(reordered, previousIndex, currentIndex);

    // Cập nhật vị trí hiển thị ngay lập tức (optimistic)
    this.columnsSignal.set(reordered);
    this.boardSignal.update((b) => (b ? { ...b, columns: reordered } : null));

    const board = this.boardSignal();
    if (!board) return;

    const orderedColumnIds = reordered.map((col) => col.id);
    this.reorderColumnsUseCase.execute(board.id, { orderedColumnIds }).subscribe({
      next: () => {
        // Success
      },
      error: () => {
        // Rollback
        this.columnsSignal.set(previousCols);
        this.boardSignal.update((b) => (b ? { ...b, columns: previousCols } : null));
        this.notifications.error('Không thể cập nhật thứ tự cột. Vui lòng thử lại.');
      },
    });
  }

  createCard(
    columnId: string,
    title: string,
    description?: string,
    onSuccess?: (card: CardSummary) => void,
    onError?: (error: string) => void,
  ): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || this.isAddingCardSignal()) return;

    const request: CreateCardRequest = {
      columnId,
      title: trimmedTitle,
      description,
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
        this.columnsSignal.update((cols) =>
          cols.map((col) =>
            col.id === columnId ? { ...col, cards: [...(col.cards || []), newCard] } : col,
          ),
        );
        this.boardSignal.update((b) =>
          b
            ? {
                ...b,
                columns: (b.columns || []).map((col) =>
                  col.id === columnId ? { ...col, cards: [...(col.cards || []), newCard] } : col,
                ),
              }
            : null,
        );
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
  ): void {
    const previousCols = JSON.parse(JSON.stringify(this.columnsSignal())) as ColumnSummary[];

    // Thực hiện di chuyển optimistic trên UI
    this.columnsSignal.update((cols) => {
      const nextCols = cols.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      const sourceCol = nextCols.find((c) => c.id === sourceColumnId);
      const targetCol = nextCols.find((c) => c.id === targetColumnId);

      if (!sourceCol || !targetCol) return cols;

      if (sourceColumnId === targetColumnId) {
        moveItemInArray(sourceCol.cards, previousIndex, currentIndex);
      } else {
        transferArrayItem(sourceCol.cards, targetCol.cards, previousIndex, currentIndex);
        // Cập nhật columnId cho card chuyển sang
        if (targetCol.cards[currentIndex]) {
          targetCol.cards[currentIndex].columnId = targetColumnId;
        }
      }

      return nextCols;
    });

    this.moveCardUseCase
      .execute(cardId, {
        targetColumnId,
        newPosition: currentIndex,
      })
      .subscribe({
        next: () => {
          // Success
        },
        error: () => {
          // Rollback khi lỗi
          this.columnsSignal.set(previousCols);
          this.notifications.error('Không thể di chuyển thẻ. Đã khôi phục lại vị trí.');
        },
      });
  }

  updateCardTitle(cardId: string, columnId: string, title: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const previousCols = this.columnsSignal();
    this.columnsSignal.update((cols) =>
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
        this.columnsSignal.set(previousCols);
        this.notifications.error('Không thể cập nhật thẻ. Vui lòng thử lại.');
      },
    });
  }

  deleteCard(cardId: string, columnId: string): void {
    this.deleteCardUseCase.execute(cardId).subscribe({
      next: () => {
        this.columnsSignal.update((cols) =>
          cols.map((col) =>
            col.id === columnId
              ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
              : col,
          ),
        );
        if (this.cardDetailSignal()?.id === cardId) {
          this.cardDetailSignal.set(null);
        }
        this.notifications.success('Đã xoá thẻ thành công');
      },
      error: () => {
        this.notifications.error('Không thể xoá thẻ. Vui lòng thử lại.');
      },
    });
  }

  loadCardDetail(cardId: string, onError?: (err: string) => void): void {
    this.isLoadingCardDetailSignal.set(true);
    this.getCardDetailUseCase.execute(cardId).subscribe({
      next: (detail) => {
        this.cardDetailSignal.set(detail);
        this.isLoadingCardDetailSignal.set(false);
      },
      error: (err) => {
        this.isLoadingCardDetailSignal.set(false);
        this.notifications.error('Không thể tải chi tiết thẻ.');
        onError?.(err?.message || 'Lỗi tải chi tiết thẻ');
      },
    });
  }

  clearCardDetail(): void {
    this.cardDetailSignal.set(null);
    this.isLoadingCardDetailSignal.set(false);
  }

  updateCard(
    cardId: string,
    updates: Partial<UpdateCardRequest> & {
      assigneeName?: string | null;
      assigneeAvatarUrl?: string | null;
    },
    onSuccess?: (updated: CardSummary) => void,
    onError?: (err: string) => void,
  ): void {
    let currentCard: CardSummary | null = null;
    for (const col of this.columnsSignal()) {
      const found = col.cards.find((c) => c.id === cardId);
      if (found) {
        currentCard = found;
        break;
      }
    }
    if (!currentCard) {
      currentCard = this.cardDetailSignal();
    }
    if (!currentCard) return;

    const previousCols = this.columnsSignal();
    const previousDetail = this.cardDetailSignal();

    const fullRequest: UpdateCardRequest = {
      title: updates.title !== undefined ? updates.title : currentCard.title,
      description:
        updates.description !== undefined ? updates.description : currentCard.description,
      coverUrl: updates.coverUrl !== undefined ? updates.coverUrl : currentCard.coverUrl,
      coverImage: updates.coverImage !== undefined ? updates.coverImage : null,
      type: updates.type !== undefined ? updates.type : currentCard.type,
      priority: updates.priority !== undefined ? updates.priority : currentCard.priority,
      assigneeId: updates.assigneeId !== undefined ? updates.assigneeId : currentCard.assigneeId,
      startDate: updates.startDate !== undefined ? updates.startDate : currentCard.startDate,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : currentCard.dueDate,
      storyPoints:
        updates.storyPoints !== undefined ? updates.storyPoints : currentCard.storyPoints,
      progressPercentage:
        updates.progressPercentage !== undefined
          ? updates.progressPercentage
          : currentCard.progressPercentage,
    };

    // Optimistic update
    this.columnsSignal.update((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
      })),
    );

    if (this.cardDetailSignal()?.id === cardId) {
      this.cardDetailSignal.update((d) => (d ? { ...d, ...updates } : null));
    }

    this.updateCardUseCase.execute(cardId, fullRequest).subscribe({
      next: (updatedCard) => {
        this.columnsSignal.update((cols) =>
          cols.map((col) => ({
            ...col,
            cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c)),
          })),
        );
        if (this.cardDetailSignal()?.id === cardId) {
          this.cardDetailSignal.update((d) => (d ? { ...d, ...updatedCard } : null));
        }
        this.notifications.success('Đã lưu thông tin thẻ thành công');
        onSuccess?.(updatedCard);
      },
      error: (err) => {
        this.columnsSignal.set(previousCols);
        this.cardDetailSignal.set(previousDetail);
        this.notifications.error('Không thể cập nhật thông tin thẻ.');
        onError?.(err?.message || 'Lỗi cập nhật thẻ');
      },
    });
  }

  addCardComment(
    cardId: string,
    contentText: string,
    onSuccess?: (comment: CardComment) => void,
  ): void {
    const trimmed = contentText.trim();
    if (!trimmed) return;

    this.addCardCommentUseCase.execute(cardId, trimmed).subscribe({
      next: (newComment) => {
        if (this.cardDetailSignal()?.id === cardId) {
          this.cardDetailSignal.update((d) => {
            if (!d) return null;
            return {
              ...d,
              comments: [newComment, ...(d.comments || [])],
              commentsCount: (d.commentsCount || 0) + 1,
            };
          });
        }

        this.columnsSignal.update((cols) =>
          cols.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === cardId ? { ...c, commentsCount: (c.commentsCount || 0) + 1 } : c,
            ),
          })),
        );

        this.notifications.success('Đã gửi bình luận');
        onSuccess?.(newComment);
      },
      error: () => {
        this.notifications.error('Không thể gửi bình luận. Vui lòng thử lại.');
      },
    });
  }

  moveCardToColumn(
    cardId: string,
    targetColumnId: string,
    onSuccess?: () => void,
  ): void {
    const cols = this.columnsSignal();
    const sourceCol = cols.find((col) => col.cards.some((c) => c.id === cardId));
    const targetCol = cols.find((col) => col.id === targetColumnId);

    if (!sourceCol || !targetCol || sourceCol.id === targetColumnId) {
      return;
    }

    const previousIndex = sourceCol.cards.findIndex((c) => c.id === cardId);
    const targetIndex = targetCol.cards.length;

    this.moveCard(cardId, sourceCol.id, targetColumnId, previousIndex, targetIndex);
    if (this.cardDetailSignal()?.id === cardId) {
      this.cardDetailSignal.update((d) => (d ? { ...d, columnId: targetColumnId } : null));
    }
    this.notifications.success(`Đã chuyển thẻ sang cột "${targetCol.title}"`);
    onSuccess?.();
  }

  toggleBoardPin(
    onSuccess?: (isPinned: boolean) => void,
    onError?: (previousPinned: boolean) => void,
  ): void {
    const board = this.boardSignal();
    if (!board) return;
    const previousPinned = !!board.isPinned;
    const nextPinned = !previousPinned;
    this.boardSignal.update((b) => (b ? { ...b, isPinned: nextPinned } : null));

    this.updateBoardPreferenceUseCase.execute(board.id, { isPinned: nextPinned }).subscribe({
      next: (pref) => {
        this.boardSignal.update((b) => (b ? { ...b, isPinned: pref.isPinned } : null));
        this.notifications.success(
          nextPinned ? 'Đã ghim bảng vào danh sách ưu tiên' : 'Đã bỏ ghim bảng',
        );
        this.loadMyBoards();
        onSuccess?.(pref.isPinned);
      },
      error: () => {
        this.boardSignal.update((b) => (b ? { ...b, isPinned: previousPinned } : null));
        this.notifications.error('Không thể cập nhật tùy chọn ghim bảng.');
        onError?.(previousPinned);
      },
    });
  }

  updateBoard(
    boardId: string,
    request: UpdateBoardRequest,
    onSuccess?: (updated: Board) => void,
    onError?: (error: string) => void,
  ): void {
    this.requests.run({
      loading: this.isUpdatingBoardSignal,
      request$: this.updateBoardUseCase.execute(boardId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Cập nhật thông tin bảng thất bại.',
      onSuccess: (updated) => {
        this.boardSignal.update((current) => {
          if (!current || current.id !== boardId) return current;
          return {
            ...current,
            title: updated.title,
            slug: updated.slug,
            type: updated.type,
          };
        });
        this.notifications.success('Đã cập nhật thông tin bảng thành công!');
        onSuccess?.(updated);
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  }

  deleteBoard(boardId: string, onSuccess?: () => void, onError?: (error: string) => void): void {
    this.requests.run({
      loading: this.isDeletingBoardSignal,
      request$: this.deleteBoardUseCase.execute(boardId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Xoá bảng thất bại.',
      onSuccess: () => {
        this.notifications.success('Đã xoá bảng và toàn bộ dữ liệu trực thuộc thành công.');
        onSuccess?.();
      },
      onError: (err) => {
        onError?.(err);
      },
    });
  }

  setBoardPinnedLocally(isPinned: boolean): void {
    this.boardSignal.update((b) => (b ? { ...b, isPinned } : null));
  }

  loadMyBoards(): void {
    this.requests.run({
      loading: this.isLoadingMyBoardsSignal,
      request$: this.getMyBoardsUseCase.execute(),
      fallbackErrorMessage: 'Không thể tải danh sách bảng gần đây.',
      toastOnError: false,
      onSuccess: (data) => {
        this.myBoardsSignal.set(data || { recentBoards: [], pinnedBoards: [] });
      },
    });
  }

  clear(): void {
    this.cancel$.next();
    this.boardSignal.set(null);
    this.columnsSignal.set([]);
    this.errorSignal.set(null);
  }
}
