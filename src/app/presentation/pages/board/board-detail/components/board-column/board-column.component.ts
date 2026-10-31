import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
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
  readonly updateColumn = output<{ columnId: string; title: string; isDoneColumn: boolean }>();

  readonly titleInputRef = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  readonly isEditingTitle = signal<boolean>(false);
  readonly editingTitleValue = signal<string>('');

  readonly newCardTitle = signal<string>('');

  startEditingTitle(): void {
    this.editingTitleValue.set(this.column().title);
    this.isEditingTitle.set(true);
    setTimeout(() => {
      const el = this.titleInputRef()?.nativeElement;
      if (el) {
        el.focus();
        el.select();
      }
    });
  }

  saveTitle(): void {
    if (!this.isEditingTitle()) return;
    this.isEditingTitle.set(false);
    const newTitle = this.editingTitleValue().trim();
    if (!newTitle || newTitle === this.column().title) {
      return;
    }
    this.updateColumn.emit({
      columnId: this.column().id,
      title: newTitle,
      isDoneColumn: this.column().isDoneColumn,
    });
  }

  cancelEditingTitle(): void {
    if (!this.isEditingTitle()) return;
    this.isEditingTitle.set(false);
    this.editingTitleValue.set(this.column().title);
  }

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
