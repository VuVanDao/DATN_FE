import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BoardDetail } from '../../../../../../domain/models/board-detail.model';

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

    const end = new Date(sprint.endDate);
    if (isNaN(end.getTime())) return null;

    // Chuẩn hóa về mốc ngày (00:00:00) theo giờ địa phương để so sánh theo lịch
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    const diffDays = Math.round((endMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const overdueDays = Math.abs(diffDays);

    return {
      name: sprint.name,
      endDate: sprint.endDate,
      isOverdue,
      overdueDays,
      diffDays,
    };
  });

  onTogglePin(): void {
    this.togglePin.emit();
  }

  onOpenMenu(): void {
    this.openMenu.emit();
  }
}
