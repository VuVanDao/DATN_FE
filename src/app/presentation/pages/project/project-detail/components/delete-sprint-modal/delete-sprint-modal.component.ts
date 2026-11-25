import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SprintStore } from '../../../../../../application/state/sprint.store';
import { SprintSummary } from '../../../../../../domain/models/sprint.model';

@Component({
  selector: 'app-delete-sprint-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './delete-sprint-modal.component.html',
})
export class DeleteSprintModalComponent {
  readonly sprintStore = inject(SprintStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() sprint: SprintSummary | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() sprintDeleted = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.sprint || !this.projectId || this.sprintStore.isDeletingSprint()) {
      return;
    }

    this.sprintStore.deleteSprint(this.sprint.id, this.projectId, this.sprint.boardId, () => {
      this.sprintDeleted.emit();
      this.close();
    });
  }

  close(): void {
    this.closed.emit();
  }
}
