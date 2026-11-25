import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Board } from '../../../../domain/models/project.model';

@Component({
  selector: 'app-switch-board-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './switch-board-modal.component.html',
})
export class SwitchBoardModalComponent {
  readonly boards = input<Board[]>([]);
  readonly activeBoardSlug = input<string>('');
  readonly currentProjectName = input<string>('');
  readonly currentWorkspaceName = input<string>('');

  readonly selectBoard = output<Board>();
  readonly togglePin = output<Board>();
  readonly close = output<void>();

  readonly searchQuery = signal('');
  readonly activeFilterTab = signal<'all' | 'workspace'>('all');
  readonly isWorkspaceAccordionOpen = signal(true);

  // Danh sách các bảng đã ghim (Starred)
  readonly starredBoards = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.boards().filter(
      (b) =>
        b.isPinned &&
        (!query || b.title.toLowerCase().includes(query) || b.slug.toLowerCase().includes(query)),
    );
  });

  // Danh sách các bảng gần đây (Recent)
  readonly recentBoards = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.boards().filter(
      (b) =>
        !query || b.title.toLowerCase().includes(query) || b.slug.toLowerCase().includes(query),
    );

    // Sắp xếp theo lastViewedAt giảm dần, nếu chưa xem thì theo createdAt
    return list.slice().sort((a, b) => {
      const timeA = a.lastViewedAt
        ? new Date(a.lastViewedAt).getTime()
        : new Date(a.createdAt).getTime();
      const timeB = b.lastViewedAt
        ? new Date(b.lastViewedAt).getTime()
        : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  });

  // Tất cả các bảng theo bộ lọc và tìm kiếm
  readonly filteredWorkspaceBoards = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.boards().filter(
      (b) =>
        !query || b.title.toLowerCase().includes(query) || b.slug.toLowerCase().includes(query),
    );
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  onSelectBoard(board: Board): void {
    this.selectBoard.emit(board);
  }

  onTogglePin(event: Event, board: Board): void {
    event.stopPropagation();
    this.togglePin.emit(board);
  }

  getBoardGradient(board: Board): string {
    const gradients = [
      'from-indigo-600 to-purple-600',
      'from-violet-600 to-indigo-700',
      'from-emerald-600 to-teal-700',
      'from-amber-500 to-orange-600',
      'from-indigo-500 via-purple-500 to-pink-500',
    ];
    let hash = 0;
    for (let i = 0; i < board.title.length; i++) {
      hash = board.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }
}
