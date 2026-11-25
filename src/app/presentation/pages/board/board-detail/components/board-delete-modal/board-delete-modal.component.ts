import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BoardStore } from '../../../../../../application/state/board.store';
import { BoardDetail } from '../../../../../../domain/models/board-detail.model';

@Component({
  selector: 'app-board-delete-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './board-delete-modal.component.html',
})
export class BoardDeleteModalComponent implements OnChanges {
  readonly boardStore = inject(BoardStore);
  readonly confirmNameInput = signal('');
  readonly deleteError = signal<string | null>(null);

  @Input() isOpen = false;
  @Input() board: BoardDetail | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  readonly isNameMatched = computed(() => {
    const targetTitle = (this.board?.title || '').trim().toLowerCase();
    return this.confirmNameInput().trim().toLowerCase() === targetTitle && targetTitle.length > 0;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.confirmNameInput.set('');
      this.deleteError.set(null);
    }
  }

  onConfirm(): void {
    if (!this.board || !this.isNameMatched() || this.boardStore.isDeletingBoard()) {
      return;
    }

    this.deleteError.set(null);
    this.boardStore.deleteBoard(
      this.board.id,
      () => {
        this.deleted.emit();
        this.close();
      },
      (err) => {
        this.deleteError.set(err);
      },
    );
  }

  close(): void {
    this.closed.emit();
  }
}
