import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary } from '../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './board-card.component.html',
})
export class BoardCardComponent {
  readonly card = input.required<CardSummary>();
  readonly cardClick = output<CardSummary>();
}
