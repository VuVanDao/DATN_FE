import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../../application/layout/layout.service';
import { AuthStore } from '../../../application/state/auth.store';
import { BoardStore } from '../../../application/state/board.store';
import { WorkspaceStore } from '../../../application/state/workspace.store';
import { MyBoardItem } from '../../../domain/models/project.model';
import { Workspace } from '../../../domain/models/workspace.model';
import { toWorkspaceView, WorkspaceView } from '../../view-models/workspace.view-model';

const BOARD_GRADIENTS = [
  'from-indigo-600 to-blue-700',
  'from-emerald-600 to-teal-700',
  'from-blue-600 to-cyan-700',
  'from-purple-600 to-violet-800',
  'from-amber-600 to-orange-700',
  'from-rose-600 to-pink-700',
  'from-teal-600 to-emerald-700',
  'from-sky-600 to-indigo-700',
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly boardStore = inject(BoardStore);
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  readonly recentBoards = computed(() => this.boardStore.myBoards().recentBoards);
  readonly pinnedBoards = computed(() => this.boardStore.myBoards().pinnedBoards);
  readonly isLoadingBoards = this.boardStore.isLoadingMyBoards;

  readonly workspaces = computed<WorkspaceView[]>(() =>
    this.workspaceStore.workspaces().map(toWorkspaceView),
  );
  readonly isLoadingWorkspaces = this.workspaceStore.isLoading;

  ngOnInit(): void {
    this.layoutService.setSidebar('main');
    this.boardStore.loadMyBoards(12);
    this.workspaceStore.loadWorkspaces();
  }

  onTogglePin(event: Event, board: MyBoardItem): void {
    event.stopPropagation();
    event.preventDefault();
    this.boardStore.toggleBoardPinById(board.boardId, board.isPinned, 12);
  }

  onBoardClick(board: MyBoardItem): void {
    void this.router.navigate(['/boards', board.boardSlug], {
      queryParams: { projectId: board.projectId },
    });
  }

  onSelectWorkspace(ws: Workspace): void {
    this.workspaceStore.selectWorkspace(ws.id);
    void this.router.navigate(['/workspaces', ws.slug]);
  }

  getBoardGradient(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % BOARD_GRADIENTS.length;
    return BOARD_GRADIENTS[index];
  }

  formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Vừa xong';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}
