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
import { SprintStore } from '../../../../../../application/state/sprint.store';
import { SprintSummary } from '../../../../../../domain/models/sprint.model';

@Component({
  selector: 'app-edit-sprint-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './edit-sprint-modal.component.html',
})
export class EditSprintModalComponent implements OnChanges {
  readonly sprintStore = inject(SprintStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() sprint: SprintSummary | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() sprintUpdated = new EventEmitter<void>();

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    }),
    goal: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    duration: new FormControl<number>(2, { nonNullable: true }),
    startDate: new FormControl<string>('', { nonNullable: true }),
    endDate: new FormControl<string>('', { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true && this.sprint) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    if (!this.sprint) return;

    const start = this.sprint.startDate ? new Date(this.sprint.startDate) : new Date();
    const end = this.sprint.endDate ? new Date(this.sprint.endDate) : new Date();

    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const durationWeeks = Math.max(1, Math.round(diffDays / 7));

    this.form.reset({
      name: this.sprint.name,
      goal: this.sprint.goal || '',
      duration: durationWeeks,
      startDate: this.formatDateForInput(start),
      endDate: this.formatDateForInput(end),
    });
  }

  onDurationChange(weeks: number): void {
    this.form.controls.duration.setValue(weeks);
    const startVal = this.form.controls.startDate.value;
    const start = startVal ? new Date(startVal) : new Date();

    if (weeks > 0) {
      const end = new Date(start);
      end.setDate(start.getDate() + weeks * 7);
      this.form.controls.endDate.setValue(this.formatDateForInput(end));
    }
  }

  onStartDateChange(): void {
    const duration = this.form.controls.duration.value;
    if (duration > 0) {
      this.onDurationChange(duration);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.sprint || !this.projectId) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, goal, startDate, endDate } = this.form.getRawValue();

    this.sprintStore.updateSprint(
      this.sprint.id,
      this.projectId,
      {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      },
      () => {
        this.sprintUpdated.emit();
        this.close();
      },
    );
  }

  close(): void {
    this.closed.emit();
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
