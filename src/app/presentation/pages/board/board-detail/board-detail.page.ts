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
import {
  CardSummary,
  ColumnSummary,
  MoveCardEvent,
} from '../../../../domain/models/board-detail.model';
import { Board, ProjectMember } from '../../../../domain/models/project.model';
import { SprintSummary } from '../../../../domain/models/sprint.model';
import { SwitchBoardModalComponent } from '../switch-board-modal/switch-board-modal.component';
import { BoardCanvasComponent } from './components/board-canvas/board-canvas.component';
import { BoardDeleteModalComponent } from './components/board-delete-modal/board-delete-modal.component';
import { BoardHeaderComponent } from './components/board-header/board-header.component';
import { BoardMenuDrawerComponent } from './components/board-menu-drawer/board-menu-drawer.component';
import { BoardSettingsModalComponent } from './components/board-settings-modal/board-settings-modal.component';
import { CardDetailModalComponent } from './components/card-detail-modal/card-detail-modal.component';

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
    CardDetailModalComponent,
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
  private pendingOpenCardId: string | null = null;

  // Trạng thái modal đổi bảng (Switch board modal)
  readonly showSwitchBoardModal = signal<boolean>(false);

  // Trạng thái menu cạnh phải (Board Menu Drawer)
  readonly showBoardMenu = signal<boolean>(false);

  // Trạng thái modal cập nhật thông tin bảng
  readonly showEditBoardModal = signal<boolean>(false);

  // Trạng thái modal xóa bảng
  readonly showDeleteBoardModal = signal<boolean>(false);

  // Trạng thái modal chi tiết thẻ (Card Detail Modal)
  readonly selectedCardForDetail = signal<CardSummary | null>(null);
  readonly showCardDetailModal = signal<boolean>(false);

  // Kiểm tra người dùng hiện tại có phải WorkspaceOwner không
  readonly isWorkspaceOwner = computed<boolean>(() => {
    const currentUserId = this.session.currentUser()?.id;
    if (!currentUserId) return false;
    const currentProject = this.projectStore.currentProject();
    if (currentProject?.currentUserRole === 'WorkspaceOwner') return true;
    const currentWorkspace = this.workspaceStore.currentWorkspace();
    if (
      currentWorkspace &&
      currentWorkspace.ownerId.toLowerCase() === currentUserId.toLowerCase()
    ) {
      return true;
    }
    const projectWorkspaceId = currentProject?.workspaceId;
    if (projectWorkspaceId) {
      const ws = this.workspaceStore.workspaces().find((w) => w.id === projectWorkspaceId);
      if (ws && ws.ownerId.toLowerCase() === currentUserId.toLowerCase()) {
        return true;
      }
    }
    return false;
  });

  // Kiểm tra quyền quản trị Bảng (ProjectLeader hoặc WorkspaceOwner)
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
    return isMemberLeader || isRoleLeader || this.isWorkspaceOwner();
  });

  // Thêm nhanh Thẻ (ID cột đang mở form nhập thẻ)
  readonly activeAddCardColumnId = signal<string | null>(null);

  // Danh sách các bảng cho modal Switch Boards
  readonly projectBoards = computed<Board[]>(() => {
    return this.projectStore.boards();
  });

  // Danh sách thành viên dự án
  readonly projectMembers = computed<ProjectMember[]>(() => {
    return this.projectStore.members();
  });

  // Scrum Board & Active Sprint helpers
  readonly isScrumBoard = computed<boolean>(() => {
    const b = this.currentBoard();
    return b?.type === 'Scrum' || String(b?.type) === '1';
  });

  readonly activeSprint = computed<SprintSummary | null>(() => {
    return this.currentBoard()?.activeSprint ?? null;
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
        const cardId = query.get('cardId') || '';

        if (!slug || !projectId) {
          return;
        }

        const isSameBoard = slug === this.currentSlug && projectId === this.currentProjectId;
        if (cardId) {
          if (isSameBoard && this.currentBoard()?.slug === slug) {
            const existing = this.findCardInColumns(cardId);
            if (existing) {
              this.openCardAndClearQueryParam(existing);
              return;
            }
          }
          this.pendingOpenCardId = cardId;
        }

        if (!isSameBoard || cardId) {
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

      if (this.pendingOpenCardId) {
        const targetId = this.pendingOpenCardId;
        this.pendingOpenCardId = null;
        const found = this.findCardInColumns(targetId);
        if (found) {
          this.openCardAndClearQueryParam(found);
        }
      }
    });
  }

  private findCardInColumns(cardId: string): CardSummary | null {
    const normalized = cardId.toLowerCase();
    for (const col of this.columns()) {
      const match = col.cards?.find((c) => c.id.toLowerCase() === normalized);
      if (match) return match;
    }
    return null;
  }

  private openCardAndClearQueryParam(card: CardSummary): void {
    this.onCardClick(card);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { cardId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
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

  // Xử lý di chuyển thẻ giữa các cột hoặc thay đổi vị trí trong cùng cột
  onMoveCard(event: MoveCardEvent): void {
    this.boardStore.moveCard(
      event.cardId,
      event.sourceColumnId,
      event.targetColumnId,
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

  confirmAddCard({
    columnId,
    title,
    onSuccess,
  }: {
    columnId: string;
    title: string;
    onSuccess?: () => void;
  }): void {
    const board = this.currentBoard();
    const isScrum = board?.type === 'Scrum' || String(board?.type) === '1';
    const sprintId = isScrum ? board?.activeSprint?.id || null : null;

    this.boardStore.createCard(columnId, title, undefined, sprintId, () => {
      onSuccess?.();
      this.cancelAddCard();
    });
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  calculateRemainingDays(endDateStr?: string | null): string | null {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return null;
    const now = new Date();
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = endMidnight.getTime() - nowMidnight.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Quá hạn ${Math.abs(diffDays)} ngày`;
    }
    if (diffDays === 0) {
      return 'Hôm nay là hạn chót';
    }
    return `Còn ${diffDays} ngày`;
  }

  calculateSprintProgress(sprint?: SprintSummary | null): number {
    if (!sprint) return 0;
    if (sprint.totalStoryPoints && sprint.totalStoryPoints > 0) {
      return Math.min(
        100,
        Math.round(((sprint.completedStoryPoints || 0) / sprint.totalStoryPoints) * 100),
      );
    }
    if (sprint.totalCards && sprint.totalCards > 0) {
      return Math.round(((sprint.completedCards || 0) / sprint.totalCards) * 100);
    }
    return 0;
  }

  goToBacklog(): void {
    const board = this.currentBoard();
    if (!board) {
      void this.router.navigate(['/workspaces']);
      return;
    }
    const queryParams = {
      tab: 'backlog',
      boardId: board.id,
      workspaceId: board.workspaceId || undefined,
    };
    if (board.workspaceId && board.projectKey) {
      void this.router.navigate(['/workspaces', board.workspaceId, 'projects', board.projectKey], {
        queryParams,
      });
    } else if (board.projectKey) {
      void this.router.navigate(['/projects', board.projectKey], { queryParams });
    } else if (board.projectId) {
      void this.router.navigate(['/projects', board.projectId], { queryParams });
    } else {
      void this.router.navigate(['/workspaces']);
    }
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

  // Card handlers
  onCardClick(card: CardSummary): void {
    this.selectedCardForDetail.set(card);
    this.showCardDetailModal.set(true);
    this.boardStore.loadCardDetail(card.id);
  }

  onCardNavigated(targetCardId: string): void {
    const cols = this.columns();
    for (const col of cols) {
      const found = col.cards?.find((c) => c.id.toLowerCase() === targetCardId.toLowerCase());
      if (found) {
        this.selectedCardForDetail.set(found);
        this.boardStore.loadCardDetail(found.id);
        return;
      }
    }
    this.boardStore.loadCardDetail(targetCardId);
  }

  closeCardDetailModal(): void {
    this.showCardDetailModal.set(false);
    this.selectedCardForDetail.set(null);
    this.boardStore.clearCardDetail();
  }

  onCardDetailColumnChanged(event: {
    cardId: string;
    columnId: string;
    columnTitle: string;
  }): void {
    this.boardStore.moveCardToColumn(event.cardId, event.columnId);
  }

  onCardDetailTitleChanged(event: { cardId: string; title: string }): void {
    this.boardStore.updateCard(event.cardId, { title: event.title }, (updated) => {
      this.syncSelectedCard(updated);
    });
  }

  onCardDetailDescriptionChanged(event: { cardId: string; description: string }): void {
    this.boardStore.updateCard(event.cardId, { description: event.description }, (updated) => {
      this.syncSelectedCard(updated);
    });
  }

  onCardDetailCoverChanged(event: {
    cardId: string;
    coverUrl: string | null;
    file?: File | null;
  }): void {
    this.boardStore.updateCard(
      event.cardId,
      { coverUrl: event.coverUrl, coverImage: event.file },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onCardDetailCommentAdded(event: { cardId: string; content: string }): void {
    this.boardStore.addCardComment(event.cardId, event.content);
  }

  onCardDetailPriorityChanged(event: { cardId: string; priority: string }): void {
    this.boardStore.updateCard(
      event.cardId,
      { priority: event.priority },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onCardDetailTypeChanged(event: { cardId: string; type: string }): void {
    const backendType = event.type === 'Feature' ? 'Features' : event.type;
    this.boardStore.updateCard(
      event.cardId,
      { type: backendType },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onCardDetailDatesChanged(event: {
    cardId: string;
    startDate: string | null;
    dueDate: string | null;
  }): void {
    this.boardStore.updateCard(
      event.cardId,
      {
        startDate: event.startDate ? new Date(event.startDate).toISOString() : null,
        dueDate: event.dueDate ? new Date(event.dueDate).toISOString() : null,
      },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onCardDetailAssigneeChanged(event: {
    cardId: string;
    assigneeId: string | null;
    assigneeName: string | null;
  }): void {
    const member = event.assigneeId
      ? this.projectMembers().find((m) => m.userId === event.assigneeId)
      : null;
    this.boardStore.updateCard(
      event.cardId,
      {
        assigneeId: event.assigneeId,
        assigneeName: event.assigneeName,
        assigneeAvatarUrl: member?.avatarUrl ?? null,
      },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onCardDetailProgressChanged(event: { cardId: string; progress: number }): void {
    this.boardStore.updateCard(
      event.cardId,
      { progressPercentage: event.progress },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onCardDetailStoryPointsChanged(event: { cardId: string; storyPoints: number | null }): void {
    this.boardStore.updateCard(
      event.cardId,
      { storyPoints: event.storyPoints },
      (updated) => {
        this.syncSelectedCard(updated);
      },
      undefined,
      true,
    );
  }

  onDependencyChanged(): void {
    this.boardStore.refreshBoard();
  }

  private syncSelectedCard(updated: CardSummary): void {
    if (this.selectedCardForDetail()?.id === updated.id) {
      this.selectedCardForDetail.set(updated);
    }
  }

  onDeleteCard({ cardId, columnId }: { cardId: string; columnId: string }): void {
    this.boardStore.deleteCard(cardId, columnId);
  }

  onUpdateCardCover(event: {
    cardId: string;
    columnId: string;
    coverUrl: string | null;
    file?: File | null;
  }): void {
    this.boardStore.updateCard(
      event.cardId,
      { coverUrl: event.coverUrl, coverImage: event.file },
      (updated) => {
        this.syncSelectedCard(updated);
      },
    );
  }

  onUpdateCardTitle({
    cardId,
    columnId,
    title,
  }: {
    cardId: string;
    columnId: string;
    title: string;
  }): void {
    this.boardStore.updateCardTitle(cardId, columnId, title);
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
      board.id,
      board.isPinned,
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

  goToHome(): void {
    void this.router.navigate(['/home-page']);
  }
}
