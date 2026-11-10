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
import {
  CardMovedMessage,
  ColumnsReorderedMessage,
  ColumnCreatedMessage,
  ColumnUpdatedMessage,
  ColumnDeletedMessage,
} from '../../domain/models/board-realtime.model';
import {
  Board,
  MyBoardItem,
  MyBoards,
  UpdateBoardRequest,
} from '../../domain/models/project.model';
import { BoardRealtimeService } from '../../infrastructure/realtime/board-realtime.service';
import { SessionService } from '../auth/session.service';
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
  private readonly boardRealtimeService = inject(BoardRealtimeService);
  private readonly sessionService = inject(SessionService);

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

  constructor() {
    this.setupRealtimeListeners();
  }

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
        this.boardRealtimeService?.joinBoard(board.id);
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
        // Cập nhật columnId & tiến độ hoàn thành 2 chiều cho card chuyển sang
        const movedCard = targetCol.cards[currentIndex];
        if (movedCard) {
          movedCard.columnId = targetColumnId;
          const pts = movedCard.storyPoints ?? 0;

          if (targetCol.isDoneColumn && !sourceCol.isDoneColumn) {
            const wasCompleted = (movedCard.progressPercentage || 0) === 100;
            movedCard.progressPercentage = 100;
            // Cập nhật thống kê activeSprint trên header nếu thẻ trước đó chưa hoàn thành
            if (!wasCompleted) {
              this.boardSignal.update((b) => {
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
          }
        }
      }

      return nextCols;
    });

    if (this.cardDetailSignal()?.id === cardId) {
      this.cardDetailSignal.update((d) => {
        if (!d) return null;
        const targetCol = this.columnsSignal().find((c) => c.id === targetColumnId);
        const sourceCol = this.columnsSignal().find((c) => c.id === sourceColumnId);
        let newProgress = d.progressPercentage;
        if (targetCol?.isDoneColumn && !sourceCol?.isDoneColumn) {
          newProgress = 100;
        }
        return {
          ...d,
          columnId: targetColumnId,
          progressPercentage: newProgress,
        };
      });
    }

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
        this.boardSignal.update((b) =>
          b
            ? {
                ...b,
                columns: (b.columns || []).map((col) =>
                  col.id === columnId
                    ? { ...col, cards: (col.cards || []).filter((card) => card.id !== cardId) }
                    : col,
                ),
              }
            : null,
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

  removeCardLocally(cardId: string): void {
    this.columnsSignal.update((cols) =>
      cols.map((col) => ({
        ...col,
        cards: (col.cards || []).filter((card) => card.id !== cardId),
      })),
    );
    this.boardSignal.update((b) =>
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
    if (this.cardDetailSignal()?.id === cardId) {
      this.clearCardDetail();
    }
  }

  removeColumnLocally(columnId: string): void {
    this.columnsSignal.update((cols) => cols.filter((col) => col.id !== columnId));
    this.boardSignal.update((b) =>
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
    const previousBoard = this.boardSignal();

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
    const oldProgress = currentCard.progressPercentage || 0;
    const newProgress =
      updates.progressPercentage !== undefined
        ? updates.progressPercentage
        : oldProgress;

    const oldPts = currentCard.storyPoints || 0;
    const newPts =
      updates.storyPoints !== undefined ? (updates.storyPoints || 0) : oldPts;
    const diffPts = newPts - oldPts;

    const completing = oldProgress < 100 && newProgress === 100;
    const uncompleting = oldProgress === 100 && newProgress < 100;

    if (completing || uncompleting || diffPts !== 0) {
      this.boardSignal.update((b) => {
        if (!b?.activeSprint) return b;
        let compCards = b.activeSprint.completedCards || 0;
        let compPts = b.activeSprint.completedStoryPoints || 0;
        let totPts = b.activeSprint.totalStoryPoints || 0;

        if (completing) {
          compCards += 1;
          compPts += newPts;
        } else if (uncompleting) {
          compCards = Math.max(0, compCards - 1);
          compPts = Math.max(0, compPts - oldPts);
        } else if (diffPts !== 0 && oldProgress === 100) {
          compPts = Math.max(0, compPts + diffPts);
        }

        if (diffPts !== 0) {
          totPts = Math.max(0, totPts + diffPts);
        }

        return {
          ...b,
          activeSprint: {
            ...b.activeSprint,
            completedCards: compCards,
            completedStoryPoints: compPts,
            totalStoryPoints: totPts,
          },
        };
      });
    }

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
        if (!silent) {
          this.notifications.success('Đã lưu thông tin thẻ thành công');
        }
        onSuccess?.(updatedCard);
      },
      error: (err) => {
        this.columnsSignal.set(previousCols);
        this.cardDetailSignal.set(previousDetail);
        this.boardSignal.set(previousBoard);
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

  moveCardToColumn(cardId: string, targetColumnId: string, onSuccess?: () => void): void {
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
    boardId?: string,
    currentPinned?: boolean,
    onSuccess?: (isPinned: boolean) => void,
    onError?: (previousPinned: boolean) => void,
  ): void {
    const targetBoardId = boardId ?? this.boardSignal()?.id;
    if (!targetBoardId) return;

    const previousPinned = currentPinned ?? !!this.boardSignal()?.isPinned;
    const nextPinned = !previousPinned;

    // 1. Cập nhật lạc quan bảng đang mở (nếu trùng ID)
    if (this.boardSignal()?.id === targetBoardId) {
      this.boardSignal.update((b) => (b ? { ...b, isPinned: nextPinned } : null));
    }

    // 2. Cập nhật lạc quan trong myBoardsSignal (cho Trang chủ & Sidebar)
    this.myBoardsSignal.update((state) => {
      const updateList = (list: MyBoardItem[]) =>
        list.map((b) => (b.boardId === targetBoardId ? { ...b, isPinned: nextPinned } : b));

      const updatedRecent = updateList(state.recentBoards);
      let updatedPinned: MyBoardItem[];

      if (nextPinned) {
        const found = state.recentBoards.find((b) => b.boardId === targetBoardId);
        if (found) {
          updatedPinned = [
            { ...found, isPinned: true },
            ...state.pinnedBoards.filter((b) => b.boardId !== targetBoardId),
          ];
        } else {
          updatedPinned = updateList(state.pinnedBoards);
        }
      } else {
        updatedPinned = state.pinnedBoards.filter((b) => b.boardId !== targetBoardId);
      }

      return {
        recentBoards: updatedRecent,
        pinnedBoards: updatedPinned,
      };
    });

    // 3. Gửi API cập nhật preference
    this.updateBoardPreferenceUseCase.execute(targetBoardId, { isPinned: nextPinned }).subscribe({
      next: (pref) => {
        if (this.boardSignal()?.id === targetBoardId) {
          this.boardSignal.update((b) => (b ? { ...b, isPinned: pref.isPinned } : null));
        }
        this.notifications.success(
          nextPinned ? 'Đã ghim bảng vào danh sách ưu tiên' : 'Đã bỏ ghim bảng',
        );
        this.loadMyBoards();
        onSuccess?.(pref.isPinned);
      },
      error: () => {
        if (this.boardSignal()?.id === targetBoardId) {
          this.boardSignal.update((b) => (b ? { ...b, isPinned: previousPinned } : null));
        }
        this.notifications.error('Không thể cập nhật tùy chọn ghim bảng.');
        this.loadMyBoards();
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

  loadMyBoards(limit?: number): void {
    this.requests.run({
      loading: this.isLoadingMyBoardsSignal,
      request$: this.getMyBoardsUseCase.execute(limit),
      fallbackErrorMessage: 'Không thể tải danh sách bảng gần đây.',
      toastOnError: false,
      onSuccess: (data) => {
        this.myBoardsSignal.set(data || { recentBoards: [], pinnedBoards: [] });
      },
    });
  }

  clear(): void {
    const current = this.boardSignal();
    if (current) {
      this.boardRealtimeService?.leaveBoard(current.id);
    }
    this.cancel$.next();
    this.boardSignal.set(null);
    this.columnsSignal.set([]);
    this.errorSignal.set(null);
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

    this.boardRealtimeService?.reconnected$?.subscribe({
      next: () => {
        const currentBoard = this.boardSignal();
        if (currentBoard) {
          this.silentReloadBoard(currentBoard.slug, currentBoard.projectId);
        }
      },
    });

    this.sessionService?.ended$?.subscribe({
      next: () => {
        this.boardRealtimeService?.stopConnection();
      },
    });
  }

  private handleRemoteColumnCreated(message: ColumnCreatedMessage): void {
    const currentBoard = this.boardSignal();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.sessionService?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this.columnsSignal();
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
    this.columnsSignal.set(nextCols);
    this.boardSignal.update((b) => (b ? { ...b, columns: nextCols } : null));
    this.notifications.info(`Cột "${message.title}" vừa được thêm bởi thành viên khác.`);
  }

  private handleRemoteColumnUpdated(message: ColumnUpdatedMessage): void {
    const currentBoard = this.boardSignal();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.sessionService?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    this.columnsSignal.update((cols) =>
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

    this.boardSignal.update((b) =>
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
    const currentBoard = this.boardSignal();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    const currentUserId = this.sessionService?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const targetCol = this.columnsSignal().find(
      (c) => c.id.toLowerCase() === message.columnId.toLowerCase(),
    );

    this.columnsSignal.update((cols) =>
      cols.filter((c) => c.id.toLowerCase() !== message.columnId.toLowerCase()),
    );

    this.boardSignal.update((b) =>
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

  private handleRemoteColumnsReordered(message: ColumnsReorderedMessage): void {
    const currentBoard = this.boardSignal();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    // Echo suppression: bỏ qua sự kiện nếu do chính user hiện tại thao tác (đã được cập nhật optimistic)
    const currentUserId = this.sessionService?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this.columnsSignal();
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

    this.columnsSignal.set(reordered);
    this.boardSignal.update((b) => (b ? { ...b, columns: reordered } : null));

    this.notifications.warning('Thứ tự các danh sách vừa được cập nhật bởi thành viên khác.');
  }

  private handleRemoteCardMoved(message: CardMovedMessage): void {
    const currentBoard = this.boardSignal();
    if (!currentBoard || currentBoard.id.toLowerCase() !== message.boardId.toLowerCase()) {
      return;
    }

    // Echo suppression: bỏ qua sự kiện nếu do chính user hiện tại thao tác (đã được cập nhật optimistic)
    const currentUserId = this.sessionService?.currentUser?.()?.id;
    if (
      message.changedByUserId &&
      currentUserId &&
      message.changedByUserId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return;
    }

    const currentCols = this.columnsSignal();
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

    this.columnsSignal.update((cols) => {
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
      // splice trả vè danh sách các phần tử bị cắt, nên dùng destructuring để lấy phần tử đầu tiên
      const [movedCard] = sourceCol.cards.splice(fromIndex, 1);
      const updatedMovedCard: CardSummary = {
        ...movedCard,
        columnId: targetCol.id,
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

    // Đồng bộ lại boardSignal
    this.boardSignal.update((b) => (b ? { ...b, columns: this.columnsSignal() } : null));

    // Nếu modal chi tiết thẻ đang mở thẻ này, cập nhật lại columnId cho modal
    this.cardDetailSignal.update((detail) =>
      detail && detail.id.toLowerCase() === message.cardId.toLowerCase()
        ? { ...detail, columnId: targetColId }
        : detail,
    );

    this.notifications.warning(
      `Thẻ "${existingCard.title}" vừa được di chuyển bởi thành viên khác.`,
    );
  }

  private silentReloadBoard(slug: string, projectId: string): void {
    this.getBoardDetailUseCase.execute(slug, projectId).subscribe({
      next: (board) => {
        this.boardSignal.set(board);
        this.columnsSignal.set(board.columns || []);
      },
      error: (err) => {
        console.warn('[BoardStore] Silent reload board failed', err);
      },
    });
  }
}
