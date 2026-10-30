import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BoardDetail } from '../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-board-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './board-header.component.html',
})
export class BoardHeaderComponent {
  readonly board = input<BoardDetail | null>(null);
  readonly togglePin = output<void>();

  onTogglePin(): void {
    this.togglePin.emit();
  }
}
