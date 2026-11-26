import { ConnectedPosition, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { formatIsoForDateInput } from '../../../../../../../shared/utils/due-date.util';

const START_POSITIONS: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 6,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -6,
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 6,
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -6,
  },
];

const END_POSITIONS: ConnectedPosition[] = [
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

@Component({
  selector: 'app-card-due-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, OverlayModule],
  templateUrl: './card-due-date-picker.component.html',
})
export class CardDueDatePickerComponent {
  readonly origin = input.required<CdkOverlayOrigin>();
  readonly isOpen = input<boolean>(false);
  readonly startDate = input<string | null | undefined>(null);
  readonly dueDate = input<string | null | undefined>(null);
  readonly placement = input<'start' | 'end'>('start');

  readonly saveDates = output<{ startDate: string | null; dueDate: string | null }>();
  readonly clearDates = output<void>();
  readonly closed = output<void>();

  readonly startDateInput = signal<string>('');
  readonly dueDateInput = signal<string>('');

  readonly overlayPositions = computed<ConnectedPosition[]>(() =>
    this.placement() === 'end' ? END_POSITIONS : START_POSITIONS,
  );

  readonly isInvalidRange = computed(() => {
    const s = this.startDateInput().trim();
    const d = this.dueDateInput().trim();
    return !!s && !!d && s > d;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.startDateInput.set(formatIsoForDateInput(this.startDate()));
        this.dueDateInput.set(formatIsoForDateInput(this.dueDate()));
      }
    });
  }

  onSave(): void {
    if (this.isInvalidRange()) return;
    const s = this.startDateInput().trim() || null;
    const d = this.dueDateInput().trim() || null;
    this.saveDates.emit({ startDate: s, dueDate: d });
  }

  onClear(): void {
    this.startDateInput.set('');
    this.dueDateInput.set('');
    this.clearDates.emit();
  }
}
