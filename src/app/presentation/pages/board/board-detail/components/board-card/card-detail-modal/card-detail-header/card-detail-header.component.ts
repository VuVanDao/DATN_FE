import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../../../../application/shared/notification.service';
import { CardSummary, ColumnSummary } from '../../../../../../../../domain/models/board-detail.model';
import { computeDueDateStatus } from '../../../../../../../../shared/utils/due-date.util';

@Component({
  selector: 'app-card-detail-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './card-detail-header.component.html',
  host: {
    class: 'block',
  },
})
export class CardDetailHeaderComponent {
  private readonly notificationService = inject(NotificationService);

  readonly card = input.required<CardSummary>();
  readonly currentColumnId = input.required<string>();
  readonly columns = input<ColumnSummary[]>([]);
  readonly coverUrl = input<string | null>(null);

  readonly columnSelected = output<ColumnSummary>();
  readonly coverSaved = output<{ coverUrl: string | null; file?: File | null }>();
  readonly coverRemoved = output<void>();
  readonly deleteCard = output<void>();
  readonly moreAction = output<string>();
  readonly closed = output<void>();

  // Dropdown states
  readonly isColumnDropdownOpen = signal<boolean>(false);
  readonly isMoreMenuOpen = signal<boolean>(false);
  readonly isCoverMenuOpen = signal<boolean>(false);

  // Cover picker state
  readonly coverUrlInput = signal<string>('');
  readonly previewCoverUrl = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly dueDateStatus = computed(() => {
    const card = this.card();
    if (!card) return null;
    return computeDueDateStatus(card.dueDate, card.isCompleted);
  });

  constructor() {
    effect(() => {
      const url = this.coverUrl();
      this.coverUrlInput.set(url || '');
      this.previewCoverUrl.set(url || null);
    });
  }

  getCurrentColumnTitle(): string {
    const col = this.columns().find((c) => c.id === this.currentColumnId());
    return col?.title || 'Doing';
  }

  toggleColumnDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isColumnDropdownOpen.update((v) => !v);
    this.isMoreMenuOpen.set(false);
    this.isCoverMenuOpen.set(false);
  }

  selectColumn(column: ColumnSummary): void {
    this.isColumnDropdownOpen.set(false);
    this.columnSelected.emit(column);
  }

  toggleMoreMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMoreMenuOpen.update((v) => !v);
    this.isColumnDropdownOpen.set(false);
    this.isCoverMenuOpen.set(false);
  }

  openCoverPicker(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isColumnDropdownOpen.set(false);
    this.isMoreMenuOpen.set(false);
    this.selectedFile.set(null);
    this.coverUrlInput.set(this.coverUrl() || '');
    this.previewCoverUrl.set(this.coverUrl() || null);
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
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
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

    this.coverSaved.emit({
      coverUrl: file ? this.previewCoverUrl() : finalUrl,
      file: file || undefined,
    });
  }

  removeCover(): void {
    this.selectedFile.set(null);
    this.coverUrlInput.set('');
    this.previewCoverUrl.set(null);
    this.closeCoverPicker();
    this.coverRemoved.emit();
  }

  onDeleteCard(): void {
    this.isMoreMenuOpen.set(false);
    this.deleteCard.emit();
  }

  onMoreActionClick(action: string): void {
    this.isMoreMenuOpen.set(false);
    this.moreAction.emit(action);
  }
}
