import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { BoardType } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-create-board-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-board-modal.component.html',
})
export class CreateBoardModalComponent implements OnChanges {
  readonly projectStore = inject(ProjectStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() boardCreated = new EventEmitter<void>();

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
    if (changes['isOpen']?.currentValue === true) {
      this.form.reset({
        title: '',
        slug: '',
        type: 'Kanban',
      });
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
    if (this.form.invalid || !this.projectId) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, slug, type } = this.form.getRawValue();

    this.projectStore.createBoard(
      {
        projectId: this.projectId,
        title: title.trim(),
        slug: slug.trim(),
        type,
      },
      () => {
        this.boardCreated.emit();
        this.close();
      },
    );
  }

  close(): void {
    this.closed.emit();
  }
}
