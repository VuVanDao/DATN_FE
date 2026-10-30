import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary, ColumnSummary } from '../../../../../../domain/models/board-detail.model';
import { BoardCardComponent } from '../board-card/board-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, CdkDropList, CdkDrag, BoardCardComponent],
  templateUrl: './board-column.component.html',
})
export class BoardColumnComponent {
  readonly column = input.required<ColumnSummary>();
  readonly isActiveAddCard = input<boolean>(false);
  readonly isAddingCard = input<boolean>(false);

  readonly cardDrop = output<CdkDragDrop<CardSummary[]>>();
  readonly openAddCard = output<string>();
  readonly cancelAddCard = output<void>();
  readonly confirmAddCard = output<{ columnId: string; title: string }>();

  readonly newCardTitle = signal<string>('');

  onOpenAdd(): void {
    this.newCardTitle.set('');
    this.openAddCard.emit(this.column().id);
  }

  onCancelAdd(): void {
    this.newCardTitle.set('');
    this.cancelAddCard.emit();
  }

  onConfirmAdd(): void {
    const title = this.newCardTitle().trim();
    if (!title || this.isAddingCard()) return;
    this.confirmAddCard.emit({ columnId: this.column().id, title });
    this.newCardTitle.set('');
  }

  onCardDropped(event: CdkDragDrop<CardSummary[]>): void {
    this.cardDrop.emit(event);
  }
}
