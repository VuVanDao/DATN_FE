import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BoardStore } from '../../../../../application/state/board.store';

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
  selector: 'app-main-sidebar-recent',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './main-sidebar-recent.component.html',
})
export class MainSidebarRecentComponent implements OnInit {
  private readonly boardStore = inject(BoardStore);

  // check trạng thái đóng mở của sidebar để hiện chỉ icon recent hoặc cả text + icon
  readonly collapsed = input(false);

  // ===== RECENT BOARDS SECTION STATE =====
  readonly isRecentOpen = signal<boolean>(false);
  readonly isRecentBoardsOpen = signal<boolean>(true);

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
}
