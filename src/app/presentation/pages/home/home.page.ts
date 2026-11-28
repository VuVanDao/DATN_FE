import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../layouts/layout.service';
import { AuthStore } from '../../../application/state/auth.store';
import { BoardStore } from '../../../application/state/board.store';
import { WorkspaceStore } from '../../../application/state/workspace.store';
import { MyBoardItem } from '../../../domain/models/project.model';
import { Workspace } from '../../../domain/models/workspace.model';
import { toWorkspaceView, WorkspaceView } from '../../view-models/workspace.view-model';
import { formatRelativeTime } from '../../../shared/utils/date.util';

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
    this.boardStore.toggleBoardPin(board.boardId, board.isPinned);
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

  readonly formatRelativeTime = formatRelativeTime;
}
