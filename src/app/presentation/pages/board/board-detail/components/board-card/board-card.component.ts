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
  readonly coverUrlInput = signal<string>('');
  readonly previewCoverUrl = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

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

  openCoverPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    this.selectedFile.set(null);
    this.coverUrlInput.set(this.card().coverUrl || '');
    this.previewCoverUrl.set(this.card().coverUrl || null);
    this.isCoverMenuOpen.set(true);
  }

  closeCoverPicker(): void {
    this.isCoverMenuOpen.set(false);
  }

  onCoverUrlChange(val: string): void {
    this.selectedFile.set(null);
    this.coverUrlInput.set(val);
    this.previewCoverUrl.set(val.trim() || null);
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Kích thước ảnh tối đa là 5MB.');
        return;
      }
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.previewCoverUrl.set(result);
        this.coverUrlInput.set(file.name);
      };
      reader.readAsDataURL(file);
    }
  }

  saveCover(): void {
    const file = this.selectedFile();
    const trimmed = this.coverUrlInput().trim();
    const finalUrl = trimmed || null;
    this.closeCoverPicker();

    if (file) {
      this.updateCover.emit({
        cardId: this.card().id,
        columnId: this.card().columnId,
        coverUrl: this.previewCoverUrl(),
        file,
      });
    } else {
      this.updateCover.emit({
        cardId: this.card().id,
        columnId: this.card().columnId,
        coverUrl: finalUrl,
      });
      if (finalUrl) {
        this.notificationService.success('Đã cập nhật ảnh bìa thẻ.');
      } else {
        this.notificationService.warning('Đã gỡ ảnh bìa thẻ.');
      }
    }
  }

  removeCover(): void {
    this.selectedFile.set(null);
    this.coverUrlInput.set('');
    this.previewCoverUrl.set(null);
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
