import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import {
  CreateSprintRequest,
  ProjectBacklog,
  StartSprintRequest,
  UpdateSprintRequest,
} from '../../domain/models/sprint.model';
import { CreateSprintUseCase } from '../sprint/create-sprint.use-case';
import { DeleteSprintUseCase } from '../sprint/delete-sprint.use-case';
import { GetProjectBacklogUseCase } from '../sprint/get-project-backlog.use-case';
import { MoveCardToSprintUseCase } from '../sprint/move-card-to-sprint.use-case';
import { StartSprintUseCase } from '../sprint/start-sprint.use-case';
import { UpdateSprintUseCase } from '../sprint/update-sprint.use-case';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

@Injectable({ providedIn: 'root' })
export class SprintStore {
  private readonly getProjectBacklogUseCase = inject(GetProjectBacklogUseCase);
  private readonly createSprintUseCase = inject(CreateSprintUseCase);
  private readonly updateSprintUseCase = inject(UpdateSprintUseCase);
  private readonly deleteSprintUseCase = inject(DeleteSprintUseCase);
  private readonly moveCardToSprintUseCase = inject(MoveCardToSprintUseCase);
  private readonly startSprintUseCase = inject(StartSprintUseCase);
  private readonly notifications = inject(NotificationService);
  private readonly requests = inject(StoreRequestRunner);

  private readonly cancel$ = new Subject<void>();
  private readonly backlogSignal = signal<ProjectBacklog | null>(null);
  private readonly loadingBacklogSignal = signal<boolean>(false);
  private readonly creatingSprintSignal = signal<boolean>(false);
  private readonly updatingSprintSignal = signal<boolean>(false);
  private readonly deletingSprintSignal = signal<boolean>(false);
  private readonly startingSprintSignal = signal<boolean>(false);
  private readonly movingCardSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly backlog = this.backlogSignal.asReadonly();
  readonly isLoadingBacklog = this.loadingBacklogSignal.asReadonly();
  readonly isCreatingSprint = this.creatingSprintSignal.asReadonly();
  readonly isUpdatingSprint = this.updatingSprintSignal.asReadonly();
  readonly isDeletingSprint = this.deletingSprintSignal.asReadonly();
  readonly isStartingSprint = this.startingSprintSignal.asReadonly();
  readonly isMovingCard = this.movingCardSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  loadBacklog(projectId: string): void {
    this.cancel$.next();
    this.errorSignal.set(null);

    this.requests.run({
      loading: this.loadingBacklogSignal,
      request$: this.getProjectBacklogUseCase.execute(projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải dữ liệu Backlog của dự án.',
      onSuccess: (data) => {
        this.backlogSignal.set(data);
      },
      onError: (err) => {
        this.errorSignal.set(err);
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
        this.loadBacklog(request.projectId);
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
        this.loadBacklog(projectId);
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
    this.backlogSignal.set(null);
    this.errorSignal.set(null);
  }
}
