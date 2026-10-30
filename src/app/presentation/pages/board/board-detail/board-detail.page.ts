import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';
import { LayoutService } from '../../../../application/layout/layout.service';
import { NotificationService } from '../../../../application/shared/notification.service';
import { BoardStore } from '../../../../application/state/board.store';
import { ProjectStore } from '../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../application/state/workspace.store';
import { CardSummary, ColumnSummary } from '../../../../domain/models/board-detail.model';
import { Board } from '../../../../domain/models/project.model';
import { SwitchBoardModalComponent } from '../switch-board-modal/switch-board-modal.component';
import { BoardCanvasComponent } from './components/board-canvas/board-canvas.component';
import { BoardHeaderComponent } from './components/board-header/board-header.component';

@Component({
  selector: 'app-board-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    BoardHeaderComponent,
    BoardCanvasComponent,
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

  readonly currentBoard = this.boardStore.currentBoard;
  readonly columns = this.boardStore.columns;
  readonly isLoading = this.boardStore.isLoading;
  readonly error = this.boardStore.error;

  // Trạng thái modal đổi bảng (Switch board modal)
  readonly showSwitchBoardModal = signal<boolean>(false);

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
    this.boardStore.loadBoard(slug, projectId, (board) => {
      // Khi tải xong chi tiết board, nạp danh sách boards của dự án để phục vụ Switch Boards modal
      if (board.projectId) {
        this.projectStore.loadBoards(board.projectId);
      }
    });
  }

  onRetry(): void {
    const board = this.currentBoard();
    if (board) {
      this.loadBoard(board.slug, board.projectId);
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
  confirmAddColumn({ title, onSuccess }: { title: string; onSuccess: () => void }): void {
    const board = this.currentBoard();
    if (!title || !board) return;

    this.boardStore.createColumn(board.id, title, () => {
      onSuccess();
    });
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
    this.projectStore.markBoardViewed(board.id);
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
}
