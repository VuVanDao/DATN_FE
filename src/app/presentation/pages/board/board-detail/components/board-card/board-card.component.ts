import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { CardSummary } from '../../../../../../domain/models/board-detail.model';
import { CardActionsMenuComponent } from './card-actions-menu/card-actions-menu.component';
import { CardCoverPickerComponent } from './card-cover-picker/card-cover-picker.component';

@Component({
  selector: 'app-board-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    OverlayModule,
    CardActionsMenuComponent,
    CardCoverPickerComponent,
  ],
  templateUrl: './board-card.component.html',
})
export class BoardCardComponent {
  private readonly notificationService = inject(NotificationService);

  readonly card = input.required<CardSummary>();
  readonly isDoneColumn = input<boolean>(false);
  readonly isCompleted = computed(
    () => !!this.card().isCompleted,
  );

  readonly cardClick = output<CardSummary>();
  readonly deleteCard = output<{ cardId: string; columnId: string }>();
  readonly updateTitle = output<{ cardId: string; columnId: string; title: string }>();
  readonly updateCover = output<{
    cardId: string;
    columnId: string;
    coverUrl: string | null;
    file?: File | null;
  }>();

  readonly titleInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('titleInput');

  readonly isMenuOpen = signal<boolean>(false);
  readonly isEditingTitle = signal<boolean>(false);
  readonly editingTitleValue = signal<string>('');
  readonly isCoverMenuOpen = signal<boolean>(false);

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isCoverMenuOpen.set(false);
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  onOpenCard(): void {
    this.closeMenu();
    this.cardClick.emit(this.card());
  }

  startEditingTitle(): void {
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

  openCoverPicker(): void {
    this.closeMenu();
    this.isCoverMenuOpen.set(true);
  }

  closeCoverPicker(): void {
    this.isCoverMenuOpen.set(false);
  }

  onSaveCover(event: { coverUrl: string | null; file?: File | null }): void {
    this.closeCoverPicker();
    this.updateCover.emit({
      cardId: this.card().id,
      columnId: this.card().columnId,
      coverUrl: event.coverUrl,
      file: event.file,
    });
    if (event.coverUrl || event.file) {
      this.notificationService.success('Đã cập nhật ảnh bìa thẻ.');
    } else {
      this.notificationService.warning('Đã gỡ ảnh bìa thẻ.');
    }
  }

  onRemoveCover(): void {
    this.closeCoverPicker();
    this.updateCover.emit({
      cardId: this.card().id,
      columnId: this.card().columnId,
      coverUrl: null,
    });
    this.notificationService.warning('Đã gỡ ảnh bìa thẻ.');
  }

  onPlaceholderAction(actionName: string): void {
    this.closeMenu();
    this.notificationService.warning(`Tính năng "${actionName}" đang được phát triển.`);
  }
}
