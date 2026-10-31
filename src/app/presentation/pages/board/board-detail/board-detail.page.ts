import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';
import { SessionService } from '../../../../application/auth/session.service';
import { LayoutService } from '../../../../application/layout/layout.service';
import { NotificationService } from '../../../../application/shared/notification.service';
import { BoardStore } from '../../../../application/state/board.store';
import { ProjectStore } from '../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../application/state/workspace.store';
import { CardSummary, ColumnSummary } from '../../../../domain/models/board-detail.model';
import { Board } from '../../../../domain/models/project.model';
import { SwitchBoardModalComponent } from '../switch-board-modal/switch-board-modal.component';
import { BoardCanvasComponent } from './components/board-canvas/board-canvas.component';
import { BoardDeleteModalComponent } from './components/board-delete-modal/board-delete-modal.component';
import { BoardHeaderComponent } from './components/board-header/board-header.component';
import { BoardMenuDrawerComponent } from './components/board-menu-drawer/board-menu-drawer.component';
import { BoardSettingsModalComponent } from './components/board-settings-modal/board-settings-modal.component';

@Component({
  selector: 'app-board-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    BoardHeaderComponent,
    BoardCanvasComponent,
    BoardMenuDrawerComponent,
    BoardSettingsModalComponent,
    BoardDeleteModalComponent,
    SwitchBoardModalComponent,
  ],
  host: {
    class: 'flex flex-col flex-1 h-full min-h-0 min-w-0 w-full overflow-hidden',
    style:
      'display: flex; flex-direction: column; flex: 1; height: 100%; min-height: 0; width: 100%;',
  },
  templateUrl: './board-detail.page.html',
})
export class BoardDetailPage implements OnInit {
  readonly boardStore = inject(BoardStore);
  readonly projectStore = inject(ProjectStore);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly layoutService = inject(LayoutService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly destroyRef = inject(DestroyRef);
  readonly notifications = inject(NotificationService);
  readonly session = inject(SessionService);

  readonly currentBoard = this.boardStore.currentBoard;
  readonly columns = this.boardStore.columns;
  readonly isLoading = this.boardStore.isLoading;
  readonly error = this.boardStore.error;

  // Lưu giữ slug và projectId hiện tại để phục vụ tính năng retry
  private currentSlug = '';
  private currentProjectId = '';

  // Trạng thái modal đổi bảng (Switch board modal)
  readonly showSwitchBoardModal = signal<boolean>(false);

  // Trạng thái menu cạnh phải (Board Menu Drawer)
  readonly showBoardMenu = signal<boolean>(false);

  // Trạng thái modal cập nhật thông tin bảng
  readonly showEditBoardModal = signal<boolean>(false);

  // Trạng thái modal xóa bảng
  readonly showDeleteBoardModal = signal<boolean>(false);

  // Kiểm tra vai trò ProjectLeader đối với dự án của bảng hiện tại
  readonly isProjectLeader = computed<boolean>(() => {
    const currentUserId = this.session.currentUser()?.id;
    if (!currentUserId) return false;
    const isMemberLeader = this.projectStore
      .members()
      .some(
        (m) =>
          m.userId.toLowerCase() === currentUserId.toLowerCase() && m.roleName === 'ProjectLeader',
      );
    const isRoleLeader = this.projectStore.currentProject()?.currentUserRole === 'ProjectLeader';
    return isMemberLeader || isRoleLeader;
  });

  // Thêm nhanh Thẻ (ID cột đang mở form nhập thẻ)
  readonly activeAddCardColumnId = signal<string | null>(null);

  // Danh sách các bảng cho modal Switch Boards
  readonly projectBoards = computed<Board[]>(() => {
    return this.projectStore.boards();
  });

  ngOnInit(): void {
    // Kích hoạt chế độ full bleed & thu gọn sidebar cho giao diện Kanban Board
    this.layoutService.setFullBleed(true);
    this.layoutService.setSidebarCollapsed(true, false);

    this.destroyRef.onDestroy(() => {
      this.layoutService.setFullBleed(false);
      this.layoutService.restoreSidebarPreference();
      this.boardStore.clear();
    });

    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, query]) => {
        const slug = params.get('boardSlug') || '';
        const projectId = query.get('projectId') || this.projectStore.currentProject()?.id || '';

        if (slug && projectId) {
          this.loadBoard(slug, projectId);
        }
      });
  }

  loadBoard(slug: string, projectId: string): void {
    this.currentSlug = slug;
    this.currentProjectId = projectId;
    this.boardStore.loadBoard(slug, projectId, (board) => {
      // Khi tải xong chi tiết board, nạp danh sách boards và thành viên của dự án
      if (board.projectId) {
        this.projectStore.loadBoards(board.projectId);
        this.projectStore.loadMembers(board.projectId);
      }
      this.projectStore.markBoardViewed(board.id);
    });
  }

  onRetry(): void {
    const slug =
      this.currentSlug ||
      this.route.snapshot.paramMap.get('boardSlug') ||
      this.currentBoard()?.slug ||
      '';
    const projectId =
      this.currentProjectId ||
      this.route.snapshot.queryParamMap.get('projectId') ||
      this.projectStore.currentProject()?.id ||
      this.currentBoard()?.projectId ||
      '';

    if (slug && projectId) {
      this.loadBoard(slug, projectId);
    }
  }

  // Xử lý kéo thả Card giữa các cột hoặc trong cùng cột
  onCardDrop({
    event,
    targetColumn,
  }: {
    event: CdkDragDrop<CardSummary[]>;
    targetColumn: ColumnSummary;
  }): void {
    const sourceColumnId = event.previousContainer.id;
    const targetColumnId = targetColumn.id;
    const card = event.item.data as CardSummary;

    if (!card) return;

    this.boardStore.moveCard(
      card.id,
      sourceColumnId,
      targetColumnId,
      event.previousIndex,
      event.currentIndex,
    );
  }

  // Xử lý kéo thả sắp xếp lại Column trên Canvas
  onColumnDrop(event: CdkDragDrop<ColumnSummary[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.boardStore.reorderColumns(event.previousIndex, event.currentIndex);
  }

  // Add Card handlers
  openAddCard(columnId: string): void {
    this.activeAddCardColumnId.set(columnId);
  }

  cancelAddCard(): void {
    this.activeAddCardColumnId.set(null);
  }

  confirmAddCard({ columnId, title }: { columnId: string; title: string }): void {
    this.boardStore.createCard(columnId, title, undefined, () => {
      this.cancelAddCard();
    });
  }

  // Add Column handler
  confirmAddColumn({
    title,
    isDoneColumn,
    onSuccess,
  }: {
    title: string;
    isDoneColumn?: boolean;
    onSuccess: () => void;
  }): void {
    const board = this.currentBoard();
    if (!title || !board) return;

    this.boardStore.createColumn(board.id, title, isDoneColumn ?? false, () => {
      onSuccess();
    });
  }

  // Update Column handler (Cập nhật tiêu đề cột inline)
  onUpdateColumn({
    columnId,
    title,
    isDoneColumn,
  }: {
    columnId: string;
    title: string;
    isDoneColumn: boolean;
  }): void {
    this.boardStore.updateColumn(columnId, title, isDoneColumn);
  }

  // Delete Column handler
  onDeleteColumn(columnId: string): void {
    this.boardStore.deleteColumn(columnId);
  }

  // Ghim / Bỏ ghim bảng hiện tại
  onToggleBoardPin(): void {
    const board = this.currentBoard();
    if (!board) return;

    const previousPinned = !!board.isPinned;
    const nextPinned = !previousPinned;

    // 1. Đồng bộ lạc quan cục bộ vào projectStore mà KHÔNG gửi thêm API request
    this.projectStore.setBoardPinnedLocally(board.id, nextPinned);

    // 2. Chỉ gọi toggleBoardPin qua boardStore (nơi duy nhất gửi HTTP request API)
    this.boardStore.toggleBoardPin(
      (isPinned) => {
        this.projectStore.setBoardPinnedLocally(board.id, isPinned);
      },
      () => {
        this.projectStore.setBoardPinnedLocally(board.id, previousPinned);
      },
    );
  }

  // Điều hướng khi chọn bảng trong Switch Boards modal
  onSelectBoardFromModal(board: Board): void {
    this.showSwitchBoardModal.set(false);
    void this.router.navigate(['/boards', board.slug], {
      queryParams: { projectId: board.projectId },
    });
  }

  // Ghim bảng từ modal Switch Board
  onTogglePinFromModal(board: Board): void {
    const current = this.currentBoard();
    const isCurrentBoard = !!current && current.id === board.id;
    const previousPinned = !!board.isPinned;
    const nextPinned = !previousPinned;

    // 1. Nếu bảng được ghim trùng với bảng đang xem, đồng bộ lạc quan lên boardStore
    if (isCurrentBoard) {
      this.boardStore.setBoardPinnedLocally(nextPinned);
    }

    // 2. Chỉ gọi toggleBoardPin qua projectStore (nơi duy nhất gửi HTTP request API)
    this.projectStore.toggleBoardPin(
      board,
      (isPinned) => {
        if (isCurrentBoard) {
          this.boardStore.setBoardPinnedLocally(isPinned);
        }
      },
      () => {
        if (isCurrentBoard) {
          this.boardStore.setBoardPinnedLocally(previousPinned);
        }
      },
    );
  }

  // Mở modal Switch Board
  openSwitchBoardModal(): void {
    this.showSwitchBoardModal.set(true);
  }

  // Đóng modal Switch Board
  closeSwitchBoardModal(): void {
    this.showSwitchBoardModal.set(false);
  }

  // Điều khiển Drawer Menu bảng
  openBoardMenu(): void {
    this.showBoardMenu.set(true);
  }

  closeBoardMenu(): void {
    this.showBoardMenu.set(false);
  }

  // Mở modal cập nhật thông tin bảng từ Menu
  openEditBoardModal(): void {
    this.showBoardMenu.set(false);
    this.showEditBoardModal.set(true);
  }

  closeEditBoardModal(): void {
    this.showEditBoardModal.set(false);
  }

  // Mở modal xóa bảng từ Menu (chỉ ProjectLeader)
  openDeleteBoardModal(): void {
    this.showBoardMenu.set(false);
    this.showDeleteBoardModal.set(true);
  }

  closeDeleteBoardModal(): void {
    this.showDeleteBoardModal.set(false);
  }

  // Xử lý sau khi xóa bảng thành công
  onBoardDeleted(): void {
    const board = this.currentBoard();
    if (board) {
      this.projectStore.removeBoardLocally(board.id);
    }
    this.onLeaveBoard();
  }

  // Xử lý sau khi cập nhật thành công thông tin bảng
  onBoardUpdated(updated: Board): void {
    this.projectStore.updateBoardLocally(updated);
    const currentSlug = this.route.snapshot.paramMap.get('boardSlug');
    if (updated.slug && updated.slug !== currentSlug) {
      void this.router.navigate(['/boards', updated.slug], {
        queryParams: { projectId: updated.projectId },
        replaceUrl: true,
      });
    }
  }

  // Thoát khỏi bảng và return về project hiện tại của bảng
  onLeaveBoard(): void {
    this.closeBoardMenu();
    const board = this.currentBoard();
    if (!board) {
      void this.router.navigate(['/workspaces']);
      return;
    }

    if (board.workspaceId && board.projectKey) {
      void this.router.navigate(['/workspaces', board.workspaceId, 'projects', board.projectKey]);
    } else if (board.projectKey) {
      void this.router.navigate(['/projects', board.projectKey]);
    } else if (board.projectId) {
      void this.router.navigate(['/projects', board.projectId]);
    } else {
      void this.router.navigate(['/workspaces']);
    }
  }
}
