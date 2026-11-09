import {
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SprintStore } from '../../../../../../application/state/sprint.store';
import { CardSummary } from '../../../../../../domain/models/board-detail.model';
import { SprintSummary } from '../../../../../../domain/models/sprint.model';
import { CreateSprintModalComponent } from '../create-sprint-modal/create-sprint-modal.component';
import { DeleteSprintModalComponent } from '../delete-sprint-modal/delete-sprint-modal.component';
import { EditSprintModalComponent } from '../edit-sprint-modal/edit-sprint-modal.component';
import { BacklogCardItemComponent } from './components/backlog-card-item/backlog-card-item.component';
import { SprintItemComponent } from './components/sprint-item/sprint-item.component';

@Component({
  selector: 'app-project-backlog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CdkDropListGroup,
    CdkDropList,
    BacklogCardItemComponent,
    SprintItemComponent,
    CreateSprintModalComponent,
    EditSprintModalComponent,
    DeleteSprintModalComponent,
  ],
  templateUrl: './project-backlog.component.html',
})
export class ProjectBacklogComponent implements OnInit, OnChanges {
  readonly sprintStore = inject(SprintStore);

  @Input({ required: true }) projectId = '';
  @Input() canManageSprint = false;
  @Input() canMoveCard = false;

  @Output() cardClick = new EventEmitter<CardSummary>();

  readonly showCreateSprintModal = signal<boolean>(false);
  readonly showEditSprintModal = signal<boolean>(false);
  readonly showDeleteSprintModal = signal<boolean>(false);

  readonly selectedSprintForEdit = signal<SprintSummary | null>(null);
  readonly selectedSprintForDelete = signal<SprintSummary | null>(null);

  readonly suggestedSprintNumber = computed(() => {
    const backlog = this.sprintStore.backlog();
    if (!backlog) return 1;
    return (backlog.futureSprints?.length || 0) + (backlog.activeSprint ? 2 : 1);
  });

  readonly availableSprints = computed(() => {
    const backlog = this.sprintStore.backlog();
    if (!backlog) return [];
    const list: { id: string; name: string }[] = [];
    if (backlog.activeSprint) {
      list.push({ id: backlog.activeSprint.id, name: backlog.activeSprint.name });
    }
    if (backlog.futureSprints) {
      for (const s of backlog.futureSprints) {
        list.push({ id: s.id, name: s.name });
      }
    }
    return list;
  });

  ngOnInit(): void {
    if (this.projectId) {
      this.sprintStore.loadBacklog(this.projectId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange && this.projectId) {
      this.sprintStore.loadBacklog(this.projectId);
    }
  }

  refreshBacklog(): void {
    if (this.projectId) {
      this.sprintStore.loadBacklog(this.projectId);
    }
  }

  openCreateSprintModal(): void {
    this.showCreateSprintModal.set(true);
  }

  closeCreateSprintModal(): void {
    this.showCreateSprintModal.set(false);
  }

  openEditSprintModal(sprint: SprintSummary): void {
    this.selectedSprintForEdit.set(sprint);
    this.showEditSprintModal.set(true);
  }

  closeEditSprintModal(): void {
    this.showEditSprintModal.set(false);
    this.selectedSprintForEdit.set(null);
  }

  openDeleteSprintModal(sprint: SprintSummary): void {
    this.selectedSprintForDelete.set(sprint);
    this.showDeleteSprintModal.set(true);
  }

  closeDeleteSprintModal(): void {
    this.showDeleteSprintModal.set(false);
    this.selectedSprintForDelete.set(null);
  }

  onCardDrop(event: CdkDragDrop<CardSummary[]>, targetSprintId: string | null): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const card = event.item.data as CardSummary;
    if (!card) return;

    // Optimistically update the UI arrays
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    // Call API 5: POST /api/sprint/move-card
    this.sprintStore.moveCardToSprint(card.id, targetSprintId, this.projectId);
  }

  onQuickMove(event: { cardId: string; targetSprintId: string | null }): void {
    this.sprintStore.moveCardToSprint(event.cardId, event.targetSprintId, this.projectId);
  }
}
