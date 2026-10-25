import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DEMO_RECENT_BOARDS } from '../../../../../infrastructure/mocks/layout.fixtures';
import { WorkspaceView } from '../../../../view-models/workspace.view-model';
export interface RecentWorkspaceItem {
  id: string;
  name: string;
  initial: string;
  color: string;
  isPinned: boolean;
}

@Component({
  selector: 'app-sidebar-recent',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar-recent.component.html',
})
export class SidebarRecentComponent {
  readonly collapsed = input(false);
  readonly workspaces = input<WorkspaceView[]>([]);
  // ===== RECENT SECTION STATE (Bảng & Workspace gần đây/đã ghim) =====
  readonly isRecentOpen = signal<boolean>(false);
  readonly isRecentBoardsOpen = signal<boolean>(true);
  readonly isRecentWorkspacesOpen = signal<boolean>(true);

  readonly recentBoards = signal(DEMO_RECENT_BOARDS);

  readonly recentBoardsList = computed(() => this.recentBoards().filter((b) => !b.isPinned));
  readonly pinnedBoardsList = computed(() => this.recentBoards().filter((b) => b.isPinned));

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
    this.isRecentOpen.update((v) => !v);
  }

  toggleRecentBoards(): void {
    this.isRecentBoardsOpen.update((v) => !v);
  }

  toggleRecentWorkspaces(): void {
    this.isRecentWorkspacesOpen.update((v) => !v);
  }
}
