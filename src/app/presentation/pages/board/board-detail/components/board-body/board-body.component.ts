import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  CardSummary,
  ColumnSummary,
  MoveCardEvent,
} from '../../../../../../domain/models/board-detail.model';
import { BoardColumnComponent } from '../board-column/board-column.component';

@Component({
  selector: 'app-board-body',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, BoardColumnComponent, CdkDrag, CdkDropList],
  templateUrl: './board-body.component.html',
})
export class BoardBodyComponent {
  readonly columns = input.required<ColumnSummary[]>();
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly activeAddCardColumnId = input<string | null>(null);
  readonly isAddingCard = input<boolean>(false);
  readonly isAddingColumn = input<boolean>(false);

  readonly retry = output<void>();
  readonly moveCard = output<MoveCardEvent>();
  readonly columnDrop = output<CdkDragDrop<ColumnSummary[]>>();
  readonly openAddCard = output<string>();
  readonly cancelAddCard = output<void>();
  readonly confirmAddCard = output<{ columnId: string; title: string; onSuccess?: () => void }>();
  readonly addColumn = output<{ title: string; isDoneColumn: boolean; onSuccess: () => void }>();
  readonly updateColumn = output<{ columnId: string; title: string; isDoneColumn: boolean }>();
  readonly deleteColumn = output<string>();
  readonly cardClick = output<CardSummary>();
  readonly deleteCard = output<{ cardId: string; columnId: string }>();
  readonly updateCardTitle = output<{ cardId: string; columnId: string; title: string }>();
  readonly updateCardCover = output<{
    cardId: string;
    columnId: string;
    coverUrl: string | null;
    file?: File | null;
  }>();
  readonly updateCardDatesFromBoardBody = output<{
    cardId: string;
    columnId: string;
    startDate: string | null;
    dueDate: string | null;
  }>();

  readonly connectedColumnIds = computed(() => this.columns().map((c) => c.id));

  readonly isAddingList = signal<boolean>(false);
  readonly newColumnTitle = signal<string>('');

  openAddList(): void {
    this.isAddingList.set(true);
    this.newColumnTitle.set('');
  }

  cancelAddList(): void {
    this.isAddingList.set(false);
    this.newColumnTitle.set('');
  }

  confirmAddList(): void {
    const title = this.newColumnTitle().trim();
    if (!title || this.isAddingColumn()) return;
    this.addColumn.emit({
      title,
      isDoneColumn: false,
      onSuccess: () => {
        this.newColumnTitle.set('');
      },
    });
  }

  onColumnCardDropped(event: CdkDragDrop<CardSummary[]>, targetColumn: ColumnSummary): void {
    const card = event.item.data as CardSummary;
    if (!card) return;

    this.moveCard.emit({
      cardId: card.id,
      sourceColumnId: event.previousContainer.id,
      targetColumnId: targetColumn.id,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }

  onColumnDrop(event: CdkDragDrop<ColumnSummary[]>): void {
    this.columnDrop.emit(event);
  }
}
