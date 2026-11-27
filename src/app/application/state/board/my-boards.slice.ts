import { inject, Injectable, signal } from '@angular/core';
import { MyBoardItem, MyBoards } from '../../../domain/models/project.model';
import { GetMyBoardsUseCase } from '../../board/get-my-boards.use-case';
import { UpdateBoardPreferenceUseCase } from '../../board/update-board-preference.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';

/**
 * Slice quản lý danh sách bảng gần đây và bảng được ghim (My Boards).
 * Phục vụ cho Trang chủ và thanh Sidebar gần đây.
 */
@Injectable({
  providedIn: 'root',
})
export class MyBoardsSlice {
  private readonly getMyBoardsUseCase = inject(GetMyBoardsUseCase);
  private readonly updateBoardPreferenceUseCase = inject(UpdateBoardPreferenceUseCase);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly myBoardsSignal = signal<MyBoards>({ recentBoards: [], pinnedBoards: [] });
  private readonly isLoadingMyBoardsSignal = signal<boolean>(false);

  readonly myBoards = this.myBoardsSignal.asReadonly();
  readonly isLoadingMyBoards = this.isLoadingMyBoardsSignal.asReadonly();

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

  updatePinLocally(targetBoardId: string, nextPinned: boolean): void {
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
  }

  toggleBoardPin(
    targetBoardId: string,
    previousPinned: boolean,
    onSuccess?: (isPinned: boolean) => void,
    onError?: (previousPinned: boolean) => void,
  ): void {
    const nextPinned = !previousPinned;

    // 1. Cập nhật lạc quan trong myBoardsSignal
    this.updatePinLocally(targetBoardId, nextPinned);

    // 2. Gửi API cập nhật preference
    this.updateBoardPreferenceUseCase.execute(targetBoardId, { isPinned: nextPinned }).subscribe({
      next: (pref) => {
        this.notifications.success(
          nextPinned ? 'Đã ghim bảng vào danh sách ưu tiên' : 'Đã bỏ ghim bảng',
        );
        this.loadMyBoards();
        onSuccess?.(pref.isPinned);
      },
      error: () => {
        this.updatePinLocally(targetBoardId, previousPinned);
        this.notifications.error('Không thể cập nhật tùy chọn ghim bảng.');
        this.loadMyBoards();
        onError?.(previousPinned);
      },
    });
  }

  clear(): void {
    this.myBoardsSignal.set({ recentBoards: [], pinnedBoards: [] });
  }
}
