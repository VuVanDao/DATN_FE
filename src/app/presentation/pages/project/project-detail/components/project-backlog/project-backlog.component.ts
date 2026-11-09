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
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { SprintStore } from '../../../../../../application/state/sprint.store';
import { CardSummary } from '../../../../../../domain/models/board-detail.model';
import { SprintSummary } from '../../../../../../domain/models/sprint.model';
import { CreateSprintModalComponent } from '../create-sprint-modal/create-sprint-modal.component';
import { DeleteSprintModalComponent } from '../delete-sprint-modal/delete-sprint-modal.component';
import { EditSprintModalComponent } from '../edit-sprint-modal/edit-sprint-modal.component';
import { StartSprintModalComponent } from '../start-sprint-modal/start-sprint-modal.component';
import { CompleteSprintModalComponent } from '../complete-sprint-modal/complete-sprint-modal.component';
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
    StartSprintModalComponent,
    CompleteSprintModalComponent,
  ],
  templateUrl: './project-backlog.component.html',
})
export class ProjectBacklogComponent implements OnInit, OnChanges {
  readonly sprintStore = inject(SprintStore);
  private readonly notifications = inject(NotificationService);

  @Input({ required: true }) projectId = '';
  @Input() canManageSprint = false;
  @Input() canMoveCard = false;

  @Output() cardClick = new EventEmitter<CardSummary>();

  readonly showCreateSprintModal = signal<boolean>(false);
  readonly showEditSprintModal = signal<boolean>(false);
  readonly showDeleteSprintModal = signal<boolean>(false);
  readonly showStartSprintModal = signal<boolean>(false);
  readonly showCompleteSprintModal = signal<boolean>(false);

  readonly selectedSprintForEdit = signal<SprintSummary | null>(null);
  readonly selectedSprintForDelete = signal<SprintSummary | null>(null);
  readonly selectedSprintForStart = signal<SprintSummary | null>(null);
  readonly selectedSprintForComplete = signal<SprintSummary | null>(null);

  readonly suggestedSprintNumber = computed(() => {
    const backlog = this.sprintStore.backlog();
    if (!backlog) return 1;
    return (backlog.futureSprints?.length || 0) + (backlog.activeSprint ? 2 : 1);
  });

  readonly hasActiveSprint = computed(() => {
    return !!this.sprintStore.backlog()?.activeSprint;
  });

  readonly futureSprintsList = computed(() => {
    const backlog = this.sprintStore.backlog();
    if (!backlog || !backlog.futureSprints) return [];
    return backlog.futureSprints.map((s) => ({ id: s.id, name: s.name }));
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

  openStartSprintModal(sprint: SprintSummary): void {
    this.selectedSprintForStart.set(sprint);
    this.showStartSprintModal.set(true);
  }

  closeStartSprintModal(): void {
    this.showStartSprintModal.set(false);
    this.selectedSprintForStart.set(null);
  }

  openCompleteSprintModal(sprint: SprintSummary): void {
    this.selectedSprintForComplete.set(sprint);
    this.showCompleteSprintModal.set(true);
  }

  closeCompleteSprintModal(): void {
    this.showCompleteSprintModal.set(false);
    this.selectedSprintForComplete.set(null);
  }

  onCardDrop(event: CdkDragDrop<CardSummary[]>, targetSprintId: string | null): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const card = event.item.data as CardSummary;
    if (!card) return;

    const activeSprint = this.sprintStore.activeSprint();
    const isSourceActive = card.sprintId === activeSprint?.id;
    const isTargetActive = targetSprintId === activeSprint?.id;

    // Chỉ ProjectLeader hoặc WorkspaceOwner mới được thay đổi phạm vi của Sprint đang chạy
    if ((isSourceActive || isTargetActive) && !this.canManageSprint) {
      this.notifications.warning(
        'Chỉ Trưởng dự án hoặc Chủ Workspace mới có quyền thay đổi phạm vi của Sprint đang chạy.',
      );
      this.sprintStore.loadBacklog(this.projectId);
      return;
    }

    // Optimistically update the UI arrays
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    // Call API 5: POST /api/sprint/move-card
    this.sprintStore.moveCardToSprint(card.id, targetSprintId, this.projectId, {
      isSourceActive,
      isTargetActive,
    });
  }

  onQuickMove(event: { cardId: string; targetSprintId: string | null }): void {
    const card = this.findCard(event.cardId);
    const activeSprint = this.sprintStore.activeSprint();
    const isSourceActive = card?.sprintId === activeSprint?.id;
    const isTargetActive = event.targetSprintId === activeSprint?.id;

    // Chỉ ProjectLeader hoặc WorkspaceOwner mới được thay đổi phạm vi của Sprint đang chạy
    if ((isSourceActive || isTargetActive) && !this.canManageSprint) {
      this.notifications.warning(
        'Chỉ Trưởng dự án hoặc Chủ Workspace mới có quyền thay đổi phạm vi của Sprint đang chạy.',
      );
      return;
    }

    this.sprintStore.moveCardToSprint(event.cardId, event.targetSprintId, this.projectId, {
      isSourceActive,
      isTargetActive,
    });
  }

  private findCard(cardId: string): CardSummary | null {
    const backlog = this.sprintStore.backlog();
    if (!backlog) return null;
    if (backlog.activeSprint?.cards) {
      const found = backlog.activeSprint.cards.find((c) => c.id === cardId);
      if (found) return found;
    }
    if (backlog.futureSprints) {
      for (const s of backlog.futureSprints) {
        const found = s.cards?.find((c) => c.id === cardId);
        if (found) return found;
      }
    }
    return backlog.backlogCards?.find((c) => c.id === cardId) || null;
  }
}
