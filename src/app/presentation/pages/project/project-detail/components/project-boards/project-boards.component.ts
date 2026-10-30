import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Board } from '../../../../../../domain/models/project.model';
import { getBoardBadgeColor, getBoardIcon } from '../../../../../view-models/project.view-model';

type BoardFilterTab = 'all' | 'Kanban' | 'Scrum';

@Component({
  selector: 'app-project-boards',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule],
  templateUrl: './project-boards.component.html',
})
export class ProjectBoardsComponent {
  readonly boards = input<Board[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly createBoard = output<void>();
  readonly boardClick = output<Board>();
  readonly togglePin = output<Board>();

  readonly searchQuery = signal('');
  readonly activeBoardTab = signal<BoardFilterTab>('all');

  readonly filteredBoards = computed(() => {
    const list = this.boards();
    const query = this.searchQuery().trim().toLowerCase();
    const tab = this.activeBoardTab();

    return list.filter((board) => {
      const matchTab = tab === 'all' || board.type.toLowerCase() === tab.toLowerCase();
      const matchQuery =
        !query ||
        board.title.toLowerCase().includes(query) ||
        board.slug.toLowerCase().includes(query);
      return matchTab && matchQuery;
    });
  });

  readonly kanbanCount = computed(
    () => this.boards().filter((b) => b.type.toLowerCase().includes('kanban')).length,
  );

  readonly scrumCount = computed(
    () => this.boards().filter((b) => b.type.toLowerCase().includes('scrum')).length,
  );

  setBoardTab(tab: BoardFilterTab): void {
    this.activeBoardTab.set(tab);
  }

  getBoardIconName(type: string): string {
    return getBoardIcon(type);
  }

  getBoardBadge(type: string) {
    return getBoardBadgeColor(type);
  }

  onBoardClick(board: Board): void {
    this.boardClick.emit(board);
  }

  onTogglePin(event: Event, board: Board): void {
    event.stopPropagation();
    this.togglePin.emit(board);
  }
}
