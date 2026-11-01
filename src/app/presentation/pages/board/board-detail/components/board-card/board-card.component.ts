import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { CardSummary } from '../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, OverlayModule],
  templateUrl: './board-card.component.html',
})
export class BoardCardComponent {
  private readonly notificationService = inject(NotificationService);

  readonly card = input.required<CardSummary>();

  readonly cardClick = output<CardSummary>();
  readonly deleteCard = output<{ cardId: string; columnId: string }>();
  readonly updateTitle = output<{ cardId: string; columnId: string; title: string }>();

  readonly titleInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('titleInput');

  readonly isMenuOpen = signal<boolean>(false);
  readonly isEditingTitle = signal<boolean>(false);
  readonly editingTitleValue = signal<string>('');

  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4,
      offsetX: 124,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
      offsetX: 124,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4,
      offsetX: 124,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
      offsetX: 124,
    },
  ];

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  onOpenCard(): void {
    this.closeMenu();
    this.cardClick.emit(this.card());
  }

  startEditingTitle(event?: MouseEvent): void {
    event?.stopPropagation();
    this.closeMenu();
    this.editingTitleValue.set(this.card().title);
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
    if (!newTitle || newTitle === this.card().title) {
      return;
    }
    this.updateTitle.emit({
      cardId: this.card().id,
      columnId: this.card().columnId,
      title: newTitle,
    });
  }

  cancelEditingTitle(): void {
    if (!this.isEditingTitle()) return;
    this.isEditingTitle.set(false);
    this.editingTitleValue.set(this.card().title);
  }

  onDeleteCard(): void {
    this.closeMenu();
    if (confirm(`Bạn có chắc chắn muốn xoá thẻ "${this.card().title}"?`)) {
      this.deleteCard.emit({
        cardId: this.card().id,
        columnId: this.card().columnId,
      });
    }
  }

  onPlaceholderAction(actionName: string): void {
    this.closeMenu();
    this.notificationService.warning(`Tính năng "${actionName}" đang được phát triển.`);
  }
}
