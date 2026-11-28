import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary, ColumnSummary } from '../../../../../../domain/models/board-detail.model';
import { BoardCardComponent } from '../board-card/board-card.component';
import { BoardColumnMenuComponent } from './board-column-menu/board-column-menu.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    BoardCardComponent,
    BoardColumnMenuComponent,
  ],
  templateUrl: './board-column.component.html',
  host: {
    class: 'w-72 shrink-0 max-h-full flex flex-col min-h-0',
  },
})
export class BoardColumnComponent {
  readonly column = input.required<ColumnSummary>();
  readonly connectedDropLists = input<string[]>([]);
  readonly isActiveAddCard = input<boolean>(false);
  readonly isAddingCard = input<boolean>(false);

  readonly cardDropped = output<CdkDragDrop<CardSummary[]>>();
  readonly openAddCard = output<string>();
  readonly cancelAddCard = output<void>();
  readonly confirmAddCard = output<{
    columnId: string;
    title: string;
    onSuccess?: () => void;
  }>();
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
  readonly updateCardDatesFromColumn = output<{
    cardId: string;
    columnId: string;
    startDate: string | null;
    dueDate: string | null;
  }>();

  readonly titleInputRef = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  readonly cardTextareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('cardTextarea');
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
    setTimeout(() => {
      this.cardTextareaRef()?.nativeElement?.focus();
    });
  }

  onCancelAdd(): void {
    this.newCardTitle.set('');
    this.cancelAddCard.emit();
  }

  onConfirmAdd(): void {
    const title = this.newCardTitle().trim();
    if (!title || this.isAddingCard()) return;
    this.confirmAddCard.emit({
      columnId: this.column().id,
      title,
      onSuccess: () => {
        this.newCardTitle.set('');
      },
    });
  }

  onCardDropped(event: CdkDragDrop<CardSummary[]>): void {
    this.cardDropped.emit(event);
  }

  onToggleDoneColumn(): void {
    const col = this.column();
    const newDoneState = !col.isDoneColumn;
    this.updateColumn.emit({
      columnId: col.id,
      title: col.title,
      isDoneColumn: newDoneState,
    });
  }

  onDeleteColumn(): void {
    if (
      confirm(
        `Bạn có chắc chắn muốn xoá cột "${this.column().title}" và toàn bộ thẻ thuộc cột này?`,
      )
    ) {
      this.deleteColumn.emit(this.column().id);
    }
  }
}
