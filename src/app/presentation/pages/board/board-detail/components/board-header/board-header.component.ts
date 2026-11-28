import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BoardDetail } from '../../../../../../domain/models/board-detail.model';
import { computeDueDateStatus } from '../../../../../../shared/utils/due-date.util';

@Component({
  selector: 'app-board-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './board-header.component.html',
})
export class BoardHeaderComponent {
  readonly board = input<BoardDetail | null>(null);
  readonly togglePin = output<void>();
  readonly openMenu = output<void>();

  readonly activeSprintStatus = computed(() => {
    const sprint = this.board()?.activeSprint;
    if (!sprint || !sprint.endDate) return null;

    const status = computeDueDateStatus(sprint.endDate, false);
    if (!status) return null;

    return {
      name: sprint.name,
      ...status,
    };
  });

  onTogglePin(): void {
    this.togglePin.emit();
  }

  onOpenMenu(): void {
    this.openMenu.emit();
  }
}
