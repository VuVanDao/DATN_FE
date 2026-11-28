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
import { formatDateForInput } from '../../../../../../shared/utils/date.util';

@Component({
  selector: 'app-create-sprint-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-sprint-modal.component.html',
})
export class CreateSprintModalComponent implements OnChanges {
  readonly sprintStore = inject(SprintStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() boardId = '';
  @Input() suggestedSprintNumber = 1;

  @Output() closed = new EventEmitter<void>();
  @Output() sprintCreated = new EventEmitter<void>();

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
    if (changes['isOpen']?.currentValue === true) {
      this.initFormDefaults();
    }
  }

  private initFormDefaults(): void {
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 14);

    const startDateStr = formatDateForInput(today);
    const endDateStr = formatDateForInput(end);

    this.form.reset({
      name: `Sprint ${this.suggestedSprintNumber}`,
      goal: '',
      duration: 2,
      startDate: startDateStr,
      endDate: endDateStr,
    });
  }

  onDurationChange(weeks: number): void {
    this.form.controls.duration.setValue(weeks);
    const startVal = this.form.controls.startDate.value;
    const start = startVal ? new Date(startVal) : new Date();

    if (weeks > 0) {
      const end = new Date(start);
      end.setDate(start.getDate() + weeks * 7);
      this.form.controls.endDate.setValue(formatDateForInput(end));
    }
  }

  onStartDateChange(): void {
    const duration = this.form.controls.duration.value;
    if (duration > 0) {
      this.onDurationChange(duration);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.projectId || !this.boardId) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, goal, startDate, endDate } = this.form.getRawValue();

    this.sprintStore.createSprint(
      {
        projectId: this.projectId,
        boardId: this.boardId,
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      },
      () => {
        this.sprintCreated.emit();
        this.close();
      },
    );
  }

  close(): void {
    this.closed.emit();
  }
}
