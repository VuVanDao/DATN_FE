import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { BoardDetail } from '../../../domain/models/board-detail.model';
import { Board, UpdateBoardRequest } from '../../../domain/models/project.model';
import { DeleteBoardUseCase } from '../../board/delete-board.use-case';
import { GetBoardDetailUseCase } from '../../board/get-board-detail.use-case';
import { UpdateBoardUseCase } from '../../board/update-board.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';

/**
 * Slice quản lý metadata và vòng đời của bảng hiện tại (Board Detail).
 * Chịu trách nhiệm tải thông tin bảng, cập nhật tiêu đề/loại bảng, xoá bảng và trạng thái ghim.
 */
@Injectable({
  providedIn: 'root',
})
export class BoardDetailSlice {
  private readonly getBoardDetailUseCase = inject(GetBoardDetailUseCase);
  private readonly updateBoardUseCase = inject(UpdateBoardUseCase);
  private readonly deleteBoardUseCase = inject(DeleteBoardUseCase);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();

  private readonly boardSignal = signal<BoardDetail | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly isUpdatingBoardSignal = signal<boolean>(false);
  private readonly isDeletingBoardSignal = signal<boolean>(false);

  readonly currentBoard = this.boardSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isUpdatingBoard = this.isUpdatingBoardSignal.asReadonly();
  readonly isDeletingBoard = this.isDeletingBoardSignal.asReadonly();

  loadBoard(
    slug: string,
    projectId: string,
    onSuccess?: (board: BoardDetail) => void,
    onError?: (err: string) => void,
  ): void {
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
        onSuccess?.(board);
      },
      onError: (err) => {
        this.errorSignal.set(err);
        onError?.(err);
      },
    });
  }

  silentReloadBoard(
    slug: string,
    projectId: string,
    onSuccess?: (board: BoardDetail) => void,
  ): void {
    this.getBoardDetailUseCase.execute(slug, projectId).subscribe({
      next: (board) => {
        this.boardSignal.set(board);
        onSuccess?.(board);
      },
      error: (err) => {
        console.warn('[BoardDetailSlice] Silent reload board failed', err);
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

  deleteBoard(
    boardId: string,
    onSuccess?: () => void,
    onError?: (error: string) => void,
  ): void {
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

  updateBoardLocally(updater: (current: BoardDetail | null) => BoardDetail | null): void {
    this.boardSignal.update(updater);
  }

  setBoard(board: BoardDetail | null): void {
    this.boardSignal.set(board);
  }

  clear(): void {
    this.cancel$.next();
    this.boardSignal.set(null);
    this.errorSignal.set(null);
  }
}
