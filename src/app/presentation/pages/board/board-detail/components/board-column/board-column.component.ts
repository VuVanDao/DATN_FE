import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { CardSummary, ColumnSummary } from '../../../../../../domain/models/board-detail.model';
import { BoardCardComponent } from '../board-card/board-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    OverlayModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    BoardCardComponent,
  ],
  templateUrl: './board-column.component.html',
  host: {
    class: 'w-72 shrink-0 max-h-full flex flex-col',
  },
})
export class BoardColumnComponent {
  private readonly notificationService = inject(NotificationService);

  readonly column = input.required<ColumnSummary>();
  readonly connectedDropLists = input<string[]>([]);
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

  readonly isMenuOpen = signal<boolean>(false);

  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
      offsetX: 136,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
      offsetX: 136,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
      offsetX: 136,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
      offsetX: 136,
    },
  ];

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

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  onAddCardFromMenu(): void {
    this.closeMenu();
    this.onOpenAdd();
  }

  onToggleDoneColumn(): void {
    const col = this.column();
    const newDoneState = !col.isDoneColumn;
    this.closeMenu();
    this.updateColumn.emit({
      columnId: col.id,
      title: col.title,
      isDoneColumn: newDoneState,
    });
  }

  onPlaceholderAction(actionName: string): void {
    this.closeMenu();
    this.notificationService.warning(`Tính năng "${actionName}" đang được phát triển.`);
  }
}
