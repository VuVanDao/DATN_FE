import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BoardStore } from '../../../../../../application/state/board.store';
import { BoardDetail } from '../../../../../../domain/models/board-detail.model';
import { Board, BoardType } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-board-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './board-settings-modal.component.html',
})
export class BoardSettingsModalComponent implements OnChanges {
  readonly boardStore = inject(BoardStore);
  readonly submitError = signal<string | null>(null);

  @Input() isOpen = false;
  @Input() board: BoardDetail | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Board>();

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    }),
    slug: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern('^[a-z0-9-]+$'),
      ],
    }),
    type: new FormControl<BoardType>('Kanban', { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true || changes['board']) {
      this.submitError.set(null);
      if (this.board) {
        this.form.reset({
          title: this.board.title || '',
          slug: this.board.slug || '',
          type: (this.board.type as BoardType) || 'Kanban',
        });
      }
    }
  }

  onTitleChange(): void {
    const title = this.form.controls.title.value;
    if (title && (!this.form.controls.slug.value || this.form.controls.slug.pristine)) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      this.form.controls.slug.setValue(slug);
    }
  }

  setType(type: BoardType): void {
    this.form.controls.type.setValue(type);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.board) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    const { title, slug, type } = this.form.getRawValue();

    this.boardStore.updateBoard(
      this.board.id,
      {
        title: title.trim(),
        slug: slug.trim(),
        type,
      },
      (updated) => {
        this.saved.emit(updated);
        this.close();
      },
      (err) => {
        this.submitError.set(err);
      },
    );
  }

  close(): void {
    this.closed.emit();
  }
}
