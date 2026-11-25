import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BoardStore } from '../../../../../application/state/board.store';
import { WorkspaceView } from '../../../../view-models/workspace.view-model';

export interface RecentWorkspaceItem {
  id: string;
  name: string;
  initial: string;
  color: string;
  isPinned: boolean;
}

const BOARD_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-sky-500',
];

@Component({
  selector: 'app-sidebar-recent',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar-recent.component.html',
})
export class SidebarRecentComponent implements OnInit {
  private readonly boardStore = inject(BoardStore);

  readonly collapsed = input(false);
  readonly workspaces = input<WorkspaceView[]>([]);

  // ===== RECENT SECTION STATE (Bảng & Workspace gần đây/đã ghim) =====
  readonly isRecentOpen = signal<boolean>(false);
  readonly isRecentBoardsOpen = signal<boolean>(true);
  readonly isRecentWorkspacesOpen = signal<boolean>(true);

  readonly recentBoardsList = computed(() => this.boardStore.myBoards().recentBoards);
  readonly pinnedBoardsList = computed(() => this.boardStore.myBoards().pinnedBoards);
  readonly isLoadingBoards = this.boardStore.isLoadingMyBoards;

  ngOnInit(): void {
    this.boardStore.loadMyBoards();
  }

  getBoardColor(boardId: string): string {
    let hash = 0;
    for (let i = 0; i < boardId.length; i++) {
      hash = (hash << 5) - hash + boardId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % BOARD_COLORS.length;
    return BOARD_COLORS[index];
  }

  readonly recentWorkspacesList = computed<RecentWorkspaceItem[]>(() =>
    this.workspaces()
      .slice(0, 2)
      .map((ws) => ({
        id: ws.id,
        name: ws.name,
        initial: ws.initial,
        color: ws.color,
        isPinned: false,
      })),
  );

  readonly pinnedWorkspacesList = computed<RecentWorkspaceItem[]>(() =>
    this.workspaces()
      .slice(2, 3)
      .map((ws) => ({
        id: ws.id,
        name: ws.name,
        initial: ws.initial,
        color: ws.color,
        isPinned: true,
      })),
  );

  toggleRecent(): void {
    const next = !this.isRecentOpen();
    this.isRecentOpen.set(next);
    if (next) {
      this.boardStore.loadMyBoards();
    }
  }

  toggleRecentBoards(): void {
    this.isRecentBoardsOpen.update((v) => !v);
  }

  toggleRecentWorkspaces(): void {
    this.isRecentWorkspacesOpen.update((v) => !v);
  }
}
