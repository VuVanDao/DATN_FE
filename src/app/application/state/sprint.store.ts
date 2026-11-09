import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { CardSummary } from '../../domain/models/board-detail.model';
import {
  CompleteSprintRequest,
  CreateSprintRequest,
  ProjectBacklog,
  SprintSummary,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../../domain/models/sprint.model';
import { CompleteSprintUseCase } from '../sprint/complete-sprint.use-case';
import { CreateSprintUseCase } from '../sprint/create-sprint.use-case';
import { DeleteSprintUseCase } from '../sprint/delete-sprint.use-case';
import { GetProjectBacklogCardsUseCase } from '../sprint/get-project-backlog-cards.use-case';
import { GetProjectSprintsUseCase } from '../sprint/get-project-sprints.use-case';
import { MoveCardToSprintUseCase } from '../sprint/move-card-to-sprint.use-case';
import { StartSprintUseCase } from '../sprint/start-sprint.use-case';
import { UpdateSprintUseCase } from '../sprint/update-sprint.use-case';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

@Injectable({ providedIn: 'root' })
export class SprintStore {
  private readonly getProjectSprintsUseCase = inject(GetProjectSprintsUseCase);
  private readonly getProjectBacklogCardsUseCase = inject(GetProjectBacklogCardsUseCase);
  private readonly createSprintUseCase = inject(CreateSprintUseCase);
  private readonly updateSprintUseCase = inject(UpdateSprintUseCase);
  private readonly deleteSprintUseCase = inject(DeleteSprintUseCase);
  private readonly moveCardToSprintUseCase = inject(MoveCardToSprintUseCase);
  private readonly startSprintUseCase = inject(StartSprintUseCase);
  private readonly completeSprintUseCase = inject(CompleteSprintUseCase);
  private readonly notifications = inject(NotificationService);
  private readonly requests = inject(StoreRequestRunner);

  private readonly cancel$ = new Subject<void>();
  private readonly currentProjectIdSignal = signal<string>('');
  private readonly sprintsSignal = signal<SprintSummary[]>([]);
  private readonly backlogCardsSignal = signal<CardSummary[]>([]);

  private readonly loadingBacklogSignal = signal<boolean>(false);
  private readonly loadingSprintsSignal = signal<boolean>(false);
  private readonly loadingBacklogCardsSignal = signal<boolean>(false);

  private readonly creatingSprintSignal = signal<boolean>(false);
  private readonly updatingSprintSignal = signal<boolean>(false);
  private readonly deletingSprintSignal = signal<boolean>(false);
  private readonly startingSprintSignal = signal<boolean>(false);
  private readonly completingSprintSignal = signal<boolean>(false);
  private readonly movingCardSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Expose independent Sprint & Backlog collections
  readonly sprints = this.sprintsSignal.asReadonly();
  readonly backlogCards = this.backlogCardsSignal.asReadonly();

  readonly activeSprint = computed<SprintSummary | null>(() => {
    return this.sprints().find((s) => s.status === 'Active' || String(s.status) === '1') || null;
  });

  readonly futureSprints = computed<SprintSummary[]>(() => {
    return this.sprints().filter((s) => s.status === 'Future' || String(s.status) === '0');
  });

  // Backward-compatible unified Backlog object for existing components
  readonly backlog = computed<ProjectBacklog | null>(() => {
    const projectId = this.currentProjectIdSignal();
    const sprints = this.sprintsSignal();
    const cards = this.backlogCardsSignal();

    if (!projectId && sprints.length === 0 && cards.length === 0) {
      return null;
    }

    return {
      projectId,
      activeSprint: this.activeSprint(),
      futureSprints: this.futureSprints(),
      backlogCards: cards,
      backlogTotalCards: cards.length,
      backlogTotalStoryPoints: cards.reduce((acc, c) => acc + (c.storyPoints || 0), 0),
    };
  });

  readonly isLoadingBacklog = computed(
    () =>
      this.loadingBacklogSignal() ||
      this.loadingSprintsSignal() ||
      this.loadingBacklogCardsSignal(),
  );

  readonly isLoadingSprints = this.loadingSprintsSignal.asReadonly();
  readonly isLoadingBacklogCards = this.loadingBacklogCardsSignal.asReadonly();

  readonly isCreatingSprint = this.creatingSprintSignal.asReadonly();
  readonly isUpdatingSprint = this.updatingSprintSignal.asReadonly();
  readonly isDeletingSprint = this.deletingSprintSignal.asReadonly();
  readonly isStartingSprint = this.startingSprintSignal.asReadonly();
  readonly isCompletingSprint = this.completingSprintSignal.asReadonly();
  readonly isMovingCard = this.movingCardSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadBacklog(projectId: string): void {
    this.currentProjectIdSignal.set(projectId);
    this.cancel$.next();
    this.errorSignal.set(null);

    this.requests.run({
      loading: this.loadingBacklogSignal,
      request$: forkJoin({
        sprints: this.getProjectSprintsUseCase.execute(projectId),
        cards: this.getProjectBacklogCardsUseCase.execute(projectId),
      }),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải dữ liệu Backlog của dự án.',
      onSuccess: ({ sprints, cards }) => {
        this.sprintsSignal.set(sprints);
        this.backlogCardsSignal.set(cards);
      },
      onError: (err) => {
        this.errorSignal.set(err);
      },
    });
  }

  loadSprints(projectId: string, onSuccess?: () => void): void {
    this.currentProjectIdSignal.set(projectId);
    this.requests.run({
      loading: this.loadingSprintsSignal,
      request$: this.getProjectSprintsUseCase.execute(projectId),
      fallbackErrorMessage: 'Không thể tải danh sách Sprint.',
      onSuccess: (sprints) => {
        this.sprintsSignal.set(sprints);
        if (onSuccess) onSuccess();
      },
    });
  }

  loadBacklogCards(projectId: string, onSuccess?: () => void): void {
    this.currentProjectIdSignal.set(projectId);
    this.requests.run({
      loading: this.loadingBacklogCardsSignal,
      request$: this.getProjectBacklogCardsUseCase.execute(projectId),
      fallbackErrorMessage: 'Không thể tải danh sách thẻ Backlog.',
      onSuccess: (cards) => {
        this.backlogCardsSignal.set(cards);
        if (onSuccess) onSuccess();
      },
    });
  }

  createSprint(request: CreateSprintRequest, onSuccess?: () => void): void {
    this.requests.run({
      loading: this.creatingSprintSignal,
      request$: this.createSprintUseCase.execute(request),
      fallbackErrorMessage: 'Không thể tạo mới Sprint.',
      onSuccess: (newSprint) => {
        this.notifications.success(`Đã tạo thành công "${newSprint.name}"`);
        this.loadSprints(request.projectId);
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  }

  updateSprint(
    sprintId: string,
    projectId: string,
    request: UpdateSprintRequest,
    onSuccess?: () => void,
  ): void {
    this.requests.run({
      loading: this.updatingSprintSignal,
      request$: this.updateSprintUseCase.execute(sprintId, request),
      fallbackErrorMessage: 'Không thể cập nhật Sprint.',
      onSuccess: (updated) => {
        this.notifications.success(`Đã cập nhật Sprint "${updated.name}"`);
        this.loadSprints(projectId);
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  }

  deleteSprint(sprintId: string, projectId: string, onSuccess?: () => void): void {
    this.requests.run({
      loading: this.deletingSprintSignal,
      request$: this.deleteSprintUseCase.execute(sprintId),
      fallbackErrorMessage: 'Không thể xóa Sprint.',
      onSuccess: () => {
        this.notifications.success('Đã xóa Sprint thành công. Các công việc đã chuyển về Backlog.');
        // Thẻ của Sprint xóa được chuyển về Backlog nên cần reload cả 2
        this.loadBacklog(projectId);
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  }

  startSprint(
    sprintId: string,
    projectId: string,
    request: StartSprintRequest,
    onSuccess?: () => void,
  ): void {
    this.requests.run({
      loading: this.startingSprintSignal,
      request$: this.startSprintUseCase.execute(sprintId, request),
      fallbackErrorMessage: 'Không thể bắt đầu Sprint.',
      onSuccess: (started) => {
        this.notifications.success(`Đã bắt đầu "${started.name}" thành công!`);
        this.loadSprints(projectId);
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  }

  completeSprint(
    sprintId: string,
    projectId: string,
    request: CompleteSprintRequest,
    onSuccess?: () => void,
  ): void {
    this.requests.run({
      loading: this.completingSprintSignal,
      request$: this.completeSprintUseCase.execute(sprintId, request),
      fallbackErrorMessage: 'Không thể hoàn thành Sprint.',
      onSuccess: (completed) => {
        this.notifications.success(`Đã hoàn thành Sprint "${completed.name}"!`);
        // Hoàn thành Sprint có thể chuyển thẻ dở dang về Backlog/Sprint khác nên reload cả 2
        this.loadBacklog(projectId);
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  }

  moveCardToSprint(
    cardId: string,
    sprintId: string | null,
    projectId: string,
    onSuccess?: () => void,
  ): void {
    this.movingCardSignal.set(true);
    this.moveCardToSprintUseCase.execute({ cardId, sprintId }).subscribe({
      next: () => {
        this.movingCardSignal.set(false);
        const targetName = sprintId ? 'Sprint' : 'Backlog';
        this.notifications.success(`Đã chuyển thẻ sang ${targetName}.`);
        this.loadBacklog(projectId);
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this.movingCardSignal.set(false);
        const msg = err?.error?.message || err?.message || 'Không thể chuyển thẻ vào Sprint.';
        this.notifications.error(msg);
        this.loadBacklog(projectId);
      },
    });
  }

  clearBacklog(): void {
    this.cancel$.next();
    this.sprintsSignal.set([]);
    this.backlogCardsSignal.set([]);
    this.errorSignal.set(null);
  }
}
