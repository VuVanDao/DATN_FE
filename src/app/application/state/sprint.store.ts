import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { CardSummary } from '../../domain/models/board-detail.model';
import {
  CompleteSprintRequest,
  CreateBacklogCardRequest,
  CreateSprintRequest,
  ProjectBacklog,
  SprintSummary,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../../domain/models/sprint.model';
import { BoardRealtimeService } from '../../infrastructure/realtime/board-realtime.service';
import { SessionService } from '../auth/session.service';
import { CompleteSprintUseCase } from '../sprint/complete-sprint.use-case';
import { CreateBacklogCardUseCase } from '../sprint/create-backlog-card.use-case';
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
  private readonly createBacklogCardUseCase = inject(CreateBacklogCardUseCase);
  private readonly notifications = inject(NotificationService);
  private readonly requests = inject(StoreRequestRunner);
  private readonly boardRealtimeService = inject(BoardRealtimeService);
  private readonly sessionService = inject(SessionService);

  private readonly cancel$ = new Subject<void>();
  private readonly currentProjectIdSignal = signal<string>('');
  private readonly currentBoardIdSignal = signal<string | null>(null);
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
  readonly currentBoardId = this.currentBoardIdSignal.asReadonly();

  readonly activeSprint = computed<SprintSummary | null>(() => {
    return this.sprints().find((s) => s.status === 'Active' || String(s.status) === '1') || null;
  });

  readonly futureSprints = computed<SprintSummary[]>(() => {
    return this.sprints().filter((s) => s.status === 'Future' || String(s.status) === '0');
  });

  // Backward-compatible unified Backlog object for existing components
  readonly backlog = computed<ProjectBacklog | null>(() => {
    const projectId = this.currentProjectIdSignal();
    const boardId = this.currentBoardIdSignal();
    const sprints = this.sprintsSignal();
    const cards = this.backlogCardsSignal();

    if (!projectId && sprints.length === 0 && cards.length === 0) {
      return null;
    }

    return {
      projectId,
      boardId,
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

  constructor() {
    this.setupRealtimeListeners();
  }

  loadBacklog(projectId: string, boardId?: string | null): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.currentProjectIdSignal.set(projectId);
    this.currentBoardIdSignal.set(targetBoardId);
    this.cancel$.next();
    this.errorSignal.set(null);

    if (targetBoardId) {
      this.boardRealtimeService?.joinBoard(targetBoardId);
    }

    this.requests.run({
      loading: this.loadingBacklogSignal,
      request$: forkJoin({
        sprints: this.getProjectSprintsUseCase.execute(projectId, targetBoardId),
        cards: this.getProjectBacklogCardsUseCase.execute(projectId, targetBoardId),
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

  loadSprints(projectId: string, boardId?: string | null, onSuccess?: () => void): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.currentProjectIdSignal.set(projectId);
    this.currentBoardIdSignal.set(targetBoardId);
    this.requests.run({
      loading: this.loadingSprintsSignal,
      request$: this.getProjectSprintsUseCase.execute(projectId, targetBoardId),
      fallbackErrorMessage: 'Không thể tải danh sách Sprint.',
      onSuccess: (sprints) => {
        this.sprintsSignal.set(sprints);
        if (onSuccess) onSuccess();
      },
    });
  }

  loadBacklogCards(projectId: string, boardId?: string | null, onSuccess?: () => void): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.currentProjectIdSignal.set(projectId);
    this.currentBoardIdSignal.set(targetBoardId);
    this.requests.run({
      loading: this.loadingBacklogCardsSignal,
      request$: this.getProjectBacklogCardsUseCase.execute(projectId, targetBoardId),
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
        this.loadBacklog(request.projectId, request.boardId || this.currentBoardIdSignal());
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
    boardId?: string | null,
    onSuccess?: () => void,
  ): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.requests.run({
      loading: this.updatingSprintSignal,
      request$: this.updateSprintUseCase.execute(sprintId, request),
      fallbackErrorMessage: 'Không thể cập nhật Sprint.',
      onSuccess: (updated) => {
        this.notifications.success(`Đã cập nhật Sprint "${updated.name}"`);
        this.loadBacklog(projectId, targetBoardId);
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  }

  deleteSprint(
    sprintId: string,
    projectId: string,
    boardId?: string | null,
    onSuccess?: () => void,
  ): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.requests.run({
      loading: this.deletingSprintSignal,
      request$: this.deleteSprintUseCase.execute(sprintId),
      fallbackErrorMessage: 'Không thể xóa Sprint.',
      onSuccess: () => {
        this.notifications.success('Đã xóa Sprint thành công. Các công việc đã chuyển về Backlog.');
        this.loadBacklog(projectId, targetBoardId);
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
    boardId?: string | null,
    onSuccess?: () => void,
  ): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.requests.run({
      loading: this.startingSprintSignal,
      request$: this.startSprintUseCase.execute(sprintId, request),
      fallbackErrorMessage: 'Không thể bắt đầu Sprint.',
      onSuccess: (started) => {
        this.notifications.success(`Đã bắt đầu "${started.name}" thành công!`);
        this.loadBacklog(projectId, targetBoardId);
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
    boardId?: string | null,
    onSuccess?: () => void,
  ): void {
    const targetBoardId = boardId !== undefined ? boardId || null : this.currentBoardIdSignal();
    this.requests.run({
      loading: this.completingSprintSignal,
      request$: this.completeSprintUseCase.execute(sprintId, request),
      fallbackErrorMessage: 'Không thể hoàn thành Sprint.',
      onSuccess: (completed) => {
        this.notifications.success(`Đã hoàn thành Sprint "${completed.name}"!`);
        this.loadBacklog(projectId, targetBoardId);
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
    options?: { isSourceActive?: boolean; isTargetActive?: boolean },
    onSuccess?: () => void,
  ): void {
    this.movingCardSignal.set(true);
    this.moveCardToSprintUseCase.execute({ cardId, sprintId }).subscribe({
      next: () => {
        this.movingCardSignal.set(false);
        if (options?.isTargetActive) {
          this.notifications.warning('Đã thêm thẻ vào Sprint đang chạy (Thay đổi phạm vi Sprint).');
        } else if (options?.isSourceActive) {
          const targetName = sprintId ? 'Sprint khác' : 'Backlog';
          this.notifications.info(
            `Đã rút thẻ từ Sprint đang chạy về ${targetName} (Thay đổi phạm vi Sprint).`,
          );
        } else {
          const targetName = sprintId ? 'Sprint' : 'Backlog';
          this.notifications.success(`Đã chuyển thẻ sang ${targetName}.`);
        }
        this.loadBacklog(projectId, this.currentBoardIdSignal());
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this.movingCardSignal.set(false);
        const msg = err?.error?.message || err?.message || 'Không thể chuyển thẻ vào Sprint.';
        this.notifications.error(msg);
        this.loadBacklog(projectId, this.currentBoardIdSignal());
      },
    });
  }

  createBacklogCard(request: CreateBacklogCardRequest, onSuccess?: () => void): void {
    this.createBacklogCardUseCase.execute(request).subscribe({
      next: (card) => {
        this.notifications.success(`Đã tạo thành công "${card.title}"`);
        this.loadBacklog(
          this.currentProjectIdSignal(),
          request.boardId || this.currentBoardIdSignal(),
        );
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Không thể tạo công việc mới.';
        this.notifications.error(msg);
      },
    });
  }

  clearBacklog(): void {
    const cur = this.currentBoardIdSignal();
    if (cur) {
      this.boardRealtimeService?.leaveBoard(cur);
    }
    this.cancel$.next();
    this.sprintsSignal.set([]);
    this.backlogCardsSignal.set([]);
    this.errorSignal.set(null);
  }

  private setupRealtimeListeners(): void {
    this.boardRealtimeService?.sprintCreated$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
        this.notifications.info(
          `Sprint "${message.sprint.name}" vừa được tạo bởi thành viên khác.`,
        );
      },
    });

    this.boardRealtimeService?.sprintStarted$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
        this.notifications.info(
          `Sprint "${message.sprint.name}" vừa được bắt đầu bởi thành viên khác.`,
        );
      },
    });

    this.boardRealtimeService?.sprintUpdated$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.sprintsSignal.update((list) =>
          list.map((s) =>
            s.id.toLowerCase() === message.sprint.id.toLowerCase()
              ? { ...s, ...message.sprint }
              : s,
          ),
        );
        this.notifications.info(`Thông tin Sprint "${message.sprint.name}" vừa được cập nhật.`);
      },
    });

    this.boardRealtimeService?.sprintCompleted$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
        this.notifications.info('Sprint vừa được hoàn thành bởi thành viên khác.');
      },
    });

    this.boardRealtimeService?.sprintDeleted$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.sprintsSignal.update((list) =>
          list.filter((s) => s.id.toLowerCase() !== message.sprintId.toLowerCase()),
        );
        this.notifications.warning('Một Sprint vừa bị xoá bởi thành viên khác.');
      },
    });

    this.boardRealtimeService?.cardSprintChanged$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
      },
    });

    this.boardRealtimeService?.cardCreated$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
        const dest = message.card.sprintId ? 'Sprint' : 'Backlog';
        this.notifications.info(
          `Công việc "${message.card.title}" vừa được thêm vào ${dest} bởi thành viên khác.`,
        );
      },
    });

    this.boardRealtimeService?.cardUpdated$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
      },
    });

    this.boardRealtimeService?.cardDeleted$?.subscribe({
      next: (message) => {
        if (!this.matchesCurrentBoard(message.boardId) || this.isSelf(message.changedByUserId))
          return;
        this.reloadBacklogSilently();
        this.notifications.warning('Một công việc vừa bị xoá bởi thành viên khác.');
      },
    });
  }

  private matchesCurrentBoard(boardId: string): boolean {
    const cur = this.currentBoardIdSignal();
    return !!cur && cur.toLowerCase() === boardId.toLowerCase();
  }

  private isSelf(userId?: string | null): boolean {
    const me = this.sessionService?.currentUser?.()?.id;
    return !!userId && !!me && userId.toLowerCase() === me.toLowerCase();
  }

  reloadBacklogSilently(): void {
    const projectId = this.currentProjectIdSignal();
    const boardId = this.currentBoardIdSignal();
    if (!projectId) return;

    forkJoin({
      sprints: this.getProjectSprintsUseCase.execute(projectId, boardId),
      cards: this.getProjectBacklogCardsUseCase.execute(projectId, boardId),
    }).subscribe({
      next: ({ sprints, cards }) => {
        this.sprintsSignal.set(sprints);
        this.backlogCardsSignal.set(cards);
      },
      error: (err) => {
        console.warn('[SprintStore] Silent reload backlog failed', err);
      },
    });
  }
}
