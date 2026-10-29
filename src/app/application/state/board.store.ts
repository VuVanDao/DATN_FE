import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import {
  BoardDetail,
  CardSummary,
  ColumnSummary,
  CreateCardRequest,
} from '../../domain/models/board-detail.model';
import { CreateCardUseCase } from '../board/create-card.use-case';
import { CreateColumnUseCase } from '../board/create-column.use-case';
import { DeleteCardUseCase } from '../board/delete-card.use-case';
import { GetBoardDetailUseCase } from '../board/get-board-detail.use-case';
import { MoveCardUseCase } from '../board/move-card.use-case';
import { ReorderColumnsUseCase } from '../board/reorder-columns.use-case';
import { UpdateBoardPreferenceUseCase } from '../board/update-board-preference.use-case';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly getBoardDetailUseCase = inject(GetBoardDetailUseCase);
  private readonly createColumnUseCase = inject(CreateColumnUseCase);
  private readonly reorderColumnsUseCase = inject(ReorderColumnsUseCase);
  private readonly createCardUseCase = inject(CreateCardUseCase);
  private readonly moveCardUseCase = inject(MoveCardUseCase);
  private readonly deleteCardUseCase = inject(DeleteCardUseCase);
  private readonly updateBoardPreferenceUseCase = inject(UpdateBoardPreferenceUseCase);

  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();

  private readonly boardSignal = signal<BoardDetail | null>(null);
  private readonly columnsSignal = signal<ColumnSummary[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly isAddingColumnSignal = signal<boolean>(false);
  private readonly isAddingCardSignal = signal<boolean>(false);

  readonly currentBoard = this.boardSignal.asReadonly();
  readonly columns = this.columnsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAddingColumn = this.isAddingColumnSignal.asReadonly();
  readonly isAddingCard = this.isAddingCardSignal.asReadonly();

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

  createColumn(boardId: string, title: string, onSuccess?: () => void): void {
    if (!title.trim() || this.isAddingColumnSignal()) return;

    this.requests.run({
      loading: this.isAddingColumnSignal,
      request$: this.createColumnUseCase.execute(boardId, { title: title.trim() }),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo cột mới thất bại.',
      onSuccess: (newColumn) => {
        // Cột mới từ API chưa có cards -> gán mảng rỗng
        const colWithCards: ColumnSummary = {
          ...newColumn,
          cards: newColumn.cards || [],
        };
        this.columnsSignal.update((cols) => [...cols, colWithCards]);
        this.notifications.success(`Đã thêm danh sách "${colWithCards.title}"`);
        onSuccess?.();
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
        this.notifications.error('Không thể cập nhật thứ tự cột. Vui lòng thử lại.');
      },
    });
  }

  createCard(
    columnId: string,
    title: string,
    description?: string,
    onSuccess?: (card: CardSummary) => void,
  ): void {
    if (!title.trim() || this.isAddingCardSignal()) return;

    const request: CreateCardRequest = {
      columnId,
      title: title.trim(),
      description,
    };

    this.requests.run({
      loading: this.isAddingCardSignal,
      request$: this.createCardUseCase.execute(request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo thẻ thất bại.',
      onSuccess: (newCard) => {
        this.columnsSignal.update((cols) =>
          cols.map((col) =>
            col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col,
          ),
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
        this.notifications.success('Đã xoá thẻ thành công');
      },
      error: () => {
        this.notifications.error('Không thể xoá thẻ. Vui lòng thử lại.');
      },
    });
  }

  toggleBoardPin(): void {
    const board = this.boardSignal();
    if (!board) return;

    const nextPinned = !board.isPinned;
    this.boardSignal.update((b) => (b ? { ...b, isPinned: nextPinned } : null));

    this.updateBoardPreferenceUseCase.execute(board.id, { isPinned: nextPinned }).subscribe({
      next: (pref) => {
        this.boardSignal.update((b) => (b ? { ...b, isPinned: pref.isPinned } : null));
        this.notifications.success(
          nextPinned ? 'Đã ghim bảng vào danh sách ưu tiên' : 'Đã bỏ ghim bảng',
        );
      },
      error: () => {
        this.boardSignal.update((b) => (b ? { ...b, isPinned: !nextPinned } : null));
        this.notifications.error('Không thể cập nhật tùy chọn ghim bảng.');
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
