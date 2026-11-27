import { moveItemInArray } from '@angular/cdk/drag-drop';
import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ColumnSummary } from '../../../domain/models/board-detail.model';
import { CreateColumnUseCase } from '../../board/create-column.use-case';
import { DeleteColumnUseCase } from '../../board/delete-column.use-case';
import { ReorderColumnsUseCase } from '../../board/reorder-columns.use-case';
import { UpdateColumnUseCase } from '../../board/update-column.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';
import { BoardDetailSlice } from './board-detail.slice';

/**
 * Slice quản lý các cột (danh sách công việc) trên Kanban Board.
 * Đảm nhiệm: thêm cột mới, đổi tên cột / toggle hoàn thành, xoá cột và kéo thả sắp xếp thứ tự cột.
 */
@Injectable({
  providedIn: 'root',
})
export class BoardColumnsSlice {
  private readonly createColumnUseCase = inject(CreateColumnUseCase);
  private readonly updateColumnUseCase = inject(UpdateColumnUseCase);
  private readonly deleteColumnUseCase = inject(DeleteColumnUseCase);
  private readonly reorderColumnsUseCase = inject(ReorderColumnsUseCase);
  private readonly boardDetail = inject(BoardDetailSlice);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();

  private readonly columnsSignal = signal<ColumnSummary[]>([]);
  private readonly isAddingColumnSignal = signal<boolean>(false);

  readonly columns = this.columnsSignal.asReadonly();
  readonly isAddingColumn = this.isAddingColumnSignal.asReadonly();

  createColumn(boardId: string, title: string, isDoneColumn = false, onSuccess?: () => void): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || this.isAddingColumnSignal()) return;

    this.requests.run({
      loading: this.isAddingColumnSignal,
      request$: this.createColumnUseCase.execute(boardId, {
        title: trimmedTitle,
        isDoneColumn,
      }),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo cột mới thất bại.',
      onSuccess: (newColumn) => {
        const colWithCards: ColumnSummary = {
          ...newColumn,
          cards: newColumn.cards || [],
        };
        this.columnsSignal.update((cols) => [...cols, colWithCards]);
        this.boardDetail.updateBoardLocally((b) =>
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

    const board = this.boardDetail.currentBoard();
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
    this.boardDetail.updateBoardLocally((b) =>
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
          this.boardDetail.updateBoardLocally((b) =>
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
    const board = this.boardDetail.currentBoard();
    if (!board) return;

    const existingCol = this.columnsSignal().find((c) => c.id === columnId);
    if (!existingCol) return;

    const previousCols = [...this.columnsSignal()];
    const previousBoardCols = board.columns ? [...board.columns] : [];

    // Cập nhật giao diện ngay lập tức (optimistic)
    this.columnsSignal.update((cols) => cols.filter((c) => c.id !== columnId));
    this.boardDetail.updateBoardLocally((b) =>
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
        this.boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: previousBoardCols } : null));
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
    this.boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: reordered } : null));

    const board = this.boardDetail.currentBoard();
    if (!board) return;

    const orderedColumnIds = reordered.map((col) => col.id);
    this.reorderColumnsUseCase.execute(board.id, { orderedColumnIds }).subscribe({
      next: () => {
        // Success
      },
      error: () => {
        // Rollback
        this.columnsSignal.set(previousCols);
        this.boardDetail.updateBoardLocally((b) => (b ? { ...b, columns: previousCols } : null));
        this.notifications.error('Không thể cập nhật thứ tự cột. Vui lòng thử lại.');
      },
    });
  }

  setColumns(cols: ColumnSummary[]): void {
    this.columnsSignal.set(cols);
  }

  updateColumnsLocally(updater: (cols: ColumnSummary[]) => ColumnSummary[]): void {
    this.columnsSignal.update(updater);
  }

  clear(): void {
    this.cancel$.next();
    this.columnsSignal.set([]);
    this.isAddingColumnSignal.set(false);
  }
}
