import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
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

  onTogglePin(): void {
    this.togglePin.emit();
  }

  onOpenMenu(): void {
    this.openMenu.emit();
  }
}
