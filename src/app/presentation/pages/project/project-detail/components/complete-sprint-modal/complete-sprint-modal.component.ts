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
import { MatIconModule } from '@angular/material/icon';
import { SprintStore } from '../../../../../../application/state/sprint.store';
import { SprintSummary } from '../../../../../../domain/models/sprint.model';

@Component({
  selector: 'app-complete-sprint-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './complete-sprint-modal.component.html',
})
export class CompleteSprintModalComponent implements OnChanges {
  readonly sprintStore = inject(SprintStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() sprint: SprintSummary | null = null;
  @Input() futureSprints: { id: string; name: string }[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() sprintCompleted = new EventEmitter<void>();

  readonly targetDestination = signal<'backlog' | 'future_sprint'>('backlog');
  readonly selectedFutureSprintId = signal<string>('');

  readonly completedCards = computed(() => this.sprint?.completedCards ?? 0);
  readonly totalCards = computed(() => this.sprint?.totalCards ?? 0);
  readonly uncompletedCards = computed(() =>
    Math.max(0, this.totalCards() - this.completedCards()),
  );

  readonly completedStoryPoints = computed(() => this.sprint?.completedStoryPoints ?? 0);
  readonly totalStoryPoints = computed(() => this.sprint?.totalStoryPoints ?? 0);
  readonly uncompletedStoryPoints = computed(() =>
    Math.max(0, this.totalStoryPoints() - this.completedStoryPoints()),
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.targetDestination.set('backlog');
      if (this.futureSprints && this.futureSprints.length > 0) {
        this.selectedFutureSprintId.set(this.futureSprints[0].id);
      } else {
        this.selectedFutureSprintId.set('');
      }
    }
  }

  setDestination(type: 'backlog' | 'future_sprint'): void {
    this.targetDestination.set(type);
    if (type === 'future_sprint' && !this.selectedFutureSprintId() && this.futureSprints.length > 0) {
      this.selectedFutureSprintId.set(this.futureSprints[0].id);
    }
  }

  onSelectFutureSprint(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedFutureSprintId.set(val);
  }

  onConfirmComplete(): void {
    if (!this.sprint || !this.projectId) return;

    let moveUnfinishedToSprintId: string | null = null;
    if (this.uncompletedCards() > 0 && this.targetDestination() === 'future_sprint') {
      moveUnfinishedToSprintId = this.selectedFutureSprintId() || null;
    }

    this.sprintStore.completeSprint(
      this.sprint.id,
      this.projectId,
      { moveUnfinishedToSprintId },
      () => {
        this.sprintCompleted.emit();
        this.close();
      },
    );
  }

  close(): void {
    this.closed.emit();
  }
}
