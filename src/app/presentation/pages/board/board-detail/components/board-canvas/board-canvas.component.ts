import { CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary, ColumnSummary } from '../../../../../../domain/models/board-detail.model';
import { BoardColumnComponent } from '../board-column/board-column.component';

@Component({
  selector: 'app-board-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, CdkDropListGroup, BoardColumnComponent],
  templateUrl: './board-canvas.component.html',
})
export class BoardCanvasComponent {
  readonly columns = input.required<ColumnSummary[]>();
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly activeAddCardColumnId = input<string | null>(null);
  readonly isAddingCard = input<boolean>(false);
  readonly isAddingColumn = input<boolean>(false);

  readonly retry = output<void>();
  readonly cardDrop = output<{ event: CdkDragDrop<CardSummary[]>; targetColumn: ColumnSummary }>();
  readonly openAddCard = output<string>();
  readonly cancelAddCard = output<void>();
  readonly confirmAddCard = output<{ columnId: string; title: string }>();
  readonly addColumn = output<{ title: string; isDoneColumn: boolean; onSuccess: () => void }>();

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

  onColumnCardDrop(event: CdkDragDrop<CardSummary[]>, targetColumn: ColumnSummary): void {
    this.cardDrop.emit({ event, targetColumn });
  }
}
