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
  selector: 'app-start-sprint-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './start-sprint-modal.component.html',
})
export class StartSprintModalComponent {
  readonly sprintStore = inject(SprintStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() sprint: SprintSummary | null = null;
  @Input() hasActiveSprint = false;

  @Output() closed = new EventEmitter<void>();
  @Output() sprintStarted = new EventEmitter<void>();

  onConfirmStart(): void {
    if (!this.sprint || !this.projectId || this.hasActiveSprint) {
      return;
    }

    // Gửi yêu cầu bắt đầu Sprint, giữ nguyên ngày giờ và mục tiêu đã thiết lập từ trước
    this.sprintStore.startSprint(
      this.sprint.id,
      this.projectId,
      {
        goal: this.sprint.goal || undefined,
        startDate: this.sprint.startDate || undefined,
        endDate: this.sprint.endDate || undefined,
      },
      () => {
        this.sprintStarted.emit();
        this.close();
      },
    );
  }

  close(): void {
    this.closed.emit();
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'Chưa thiết lập';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  calculateDurationDays(): number | null {
    if (!this.sprint?.startDate || !this.sprint?.endDate) return null;
    const start = new Date(this.sprint.startDate).getTime();
    const end = new Date(this.sprint.endDate).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }
}
