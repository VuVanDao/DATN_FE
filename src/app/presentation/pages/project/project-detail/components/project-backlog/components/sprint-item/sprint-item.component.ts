import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  computed,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CardSummary } from '../../../../../../../../domain/models/board-detail.model';
import { SprintSummary } from '../../../../../../../../domain/models/sprint.model';
import { BacklogCardItemComponent } from '../backlog-card-item/backlog-card-item.component';

@Component({
  selector: 'app-sprint-item',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, CdkDropList, BacklogCardItemComponent],
  templateUrl: './sprint-item.component.html',
  host: {
    class: 'block',
  },
})
export class SprintItemComponent {
  @Input({ required: true }) sprint!: SprintSummary;
  @Input() availableSprints: { id: string; name: string }[] = [];
  @Input() canManageSprint = false;
  @Input() canMoveCard = false;

  @Output() cardClick = new EventEmitter<CardSummary>();
  @Output() cardDrop = new EventEmitter<{ event: CdkDragDrop<CardSummary[]>; targetSprintId: string }>();
  @Output() quickMove = new EventEmitter<{ cardId: string; targetSprintId: string | null }>();
  @Output() editSprint = new EventEmitter<SprintSummary>();
  @Output() deleteSprint = new EventEmitter<SprintSummary>();
  @Output() startSprint = new EventEmitter<SprintSummary>();
  @Output() completeSprint = new EventEmitter<SprintSummary>();
  @Output() addCard = new EventEmitter<{ title: string; storyPoints?: number }>();

  readonly showActionsMenu = signal<boolean>(false);
  readonly isCollapsed = signal<boolean>(false);
  readonly isAddingCard = signal<boolean>(false);

  newCardTitle = '';
  newCardStoryPoints: number | null = null;

  readonly isActive = computed(() => {
    const s = this.sprint?.status;
    return s === 'Active' || String(s) === '1';
  });

  get sprintDueStatus(): { isOverdue: boolean; diffDays: number; overdueDays: number } | null {
    if (!this.sprint?.endDate || !this.isActive()) return null;
    const end = new Date(this.sprint.endDate);
    if (isNaN(end.getTime())) return null;

    // Chuẩn hóa về mốc ngày (00:00:00) theo giờ địa phương để so sánh theo lịch
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    const diffDays = Math.round((endMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const overdueDays = Math.abs(diffDays);

    return {
      isOverdue,
      diffDays,
      overdueDays,
    };
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showActionsMenu()) {
      this.showActionsMenu.set(false);
    }
  }

  startAddCard(): void {
    this.isAddingCard.set(true);
    this.newCardTitle = '';
    this.newCardStoryPoints = null;
  }

  cancelAddCard(): void {
    this.isAddingCard.set(false);
    this.newCardTitle = '';
    this.newCardStoryPoints = null;
  }

  confirmAddCard(inputEl?: HTMLInputElement): void {
    const title = this.newCardTitle.trim();
    if (!title) return;
    this.addCard.emit({
      title,
      storyPoints: this.newCardStoryPoints ?? undefined,
    });
    // Giữ form mở để người dùng tiếp tục nhập thẻ liên tục
    this.newCardTitle = '';
    this.newCardStoryPoints = null;
    if (inputEl) {
      setTimeout(() => inputEl.focus(), 0);
    }
  }

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  toggleActionsMenu(event: Event): void {
    event.stopPropagation();
    this.showActionsMenu.update((v) => !v);
  }

  onDrop(event: CdkDragDrop<CardSummary[]>): void {
    this.cardDrop.emit({ event, targetSprintId: this.sprint.id });
  }

  openEdit(event: Event): void {
    event.stopPropagation();
    this.showActionsMenu.set(false);
    this.editSprint.emit(this.sprint);
  }

  openDelete(event: Event): void {
    event.stopPropagation();
    this.showActionsMenu.set(false);
    this.deleteSprint.emit(this.sprint);
  }

  onStartSprint(event: Event): void {
    event.stopPropagation();
    this.startSprint.emit(this.sprint);
  }

  onCompleteSprint(event: Event): void {
    event.stopPropagation();
    this.completeSprint.emit(this.sprint);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
