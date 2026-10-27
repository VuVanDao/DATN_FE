import { inject, Injectable, signal } from '@angular/core';
import { merge, Subject } from 'rxjs';
import {
  AddProjectMembersRequest,
  Board,
  CreateBoardRequest,
  Project,
  ProjectMember,
  ProjectRole,
  UpdateProjectRequest,
} from '../../domain/models/project.model';
import { AddProjectMembersUseCase } from '../project/add-project-members.use-case';
import { CreateBoardUseCase } from '../project/create-board.use-case';
import { DeleteProjectUseCase } from '../project/delete-project.use-case';
import { GetProjectBoardsUseCase } from '../project/get-project-boards.use-case';
import { GetProjectDetailUseCase } from '../project/get-project-detail.use-case';
import { GetProjectMembersUseCase } from '../project/get-project-members.use-case';
import { GetProjectRolesUseCase } from '../project/get-project-roles.use-case';
import { UpdateProjectUseCase } from '../project/update-project.use-case';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly getProjectDetailUseCase = inject(GetProjectDetailUseCase);
  private readonly getProjectBoardsUseCase = inject(GetProjectBoardsUseCase);
  private readonly getProjectMembersUseCase = inject(GetProjectMembersUseCase);
  private readonly getProjectRolesUseCase = inject(GetProjectRolesUseCase);
  private readonly updateProjectUseCase = inject(UpdateProjectUseCase);
  private readonly addProjectMembersUseCase = inject(AddProjectMembersUseCase);
  private readonly createBoardUseCase = inject(CreateBoardUseCase);
  private readonly deleteProjectUseCase = inject(DeleteProjectUseCase);

  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();
  private readonly membersReadCancel$ = new Subject<void>();
  private readonly projectSignal = signal<Project | null>(null);
  private readonly boardsSignal = signal<Board[]>([]);
  private readonly membersSignal = signal<ProjectMember[]>([]);
  private readonly rolesSignal = signal<ProjectRole[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly loadingBoardsSignal = signal<boolean>(false);
  private readonly savingSignal = signal<boolean>(false);
  private readonly deletingSignal = signal(false); // trạng thái đang xóa dự án
  private readonly addingMemberSignal = signal<boolean>(false);
  private readonly creatingBoardSignal = signal<boolean>(false);
  private readonly loadingRolesSignal = signal(false);
  private readonly rolesErrorSignal = signal<string | null>(null);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentProject = this.projectSignal.asReadonly();
  readonly boards = this.boardsSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();

  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isLoadingBoards = this.loadingBoardsSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly isDeleting = this.deletingSignal.asReadonly();
  readonly isAddingMember = this.addingMemberSignal.asReadonly();
  readonly isCreatingBoard = this.creatingBoardSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isLoadingRoles = this.loadingRolesSignal.asReadonly();
  readonly rolesError = this.rolesErrorSignal.asReadonly();

  getProjectDetail(
    projectKey: string,
    workspaceId: string,
    onSuccess?: (project: Project) => void,
  ): void {
    this.clear();
    this.requests.run({
      loading: this.loadingSignal,
      request$: this.getProjectDetailUseCase.execute(projectKey, workspaceId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải thông tin dự án',
      toastOnError: false,
      onSuccess: (project) => {
        this.projectSignal.set(project);
        if (project.isMember !== false) {
          this.loadBoards(project.id);
          this.loadMembers(project.id);
        }
        onSuccess?.(project);
      },
      onError: (err) => {
        this.errorSignal.set(err);
      },
    });
  }

  loadBoards(projectId: string): void {
    this.requests.run({
      loading: this.loadingBoardsSignal,
      request$: this.getProjectBoardsUseCase.execute(projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách bảng',
      toastOnError: false,
      onSuccess: (boards) => {
        this.boardsSignal.set(boards);
      },
      onError: () => {
        this.boardsSignal.set([]);
      },
    });
  }

  loadMembers(projectId: string): void {
    this.membersReadCancel$.next();
    this.requests.run({
      loading: signal(false),
      request$: this.getProjectMembersUseCase.execute(projectId),
      cancel$: merge(this.cancel$, this.membersReadCancel$),
      fallbackErrorMessage: 'Không thể tải danh sách thành viên',
      onSuccess: (members) => {
        this.membersSignal.set(members);
        this.projectSignal.update((project) =>
          project?.id === projectId ? { ...project, membersCount: members.length } : project,
        );
      },
    });
  }

  loadRoles(): void {
    if (this.loadingRolesSignal() || this.rolesSignal().length > 0) return;
    this.rolesErrorSignal.set(null);
    this.requests.run({
      loading: this.loadingRolesSignal,
      request$: this.getProjectRolesUseCase.execute(),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách vai trò',
      toastOnError: false,
      onSuccess: (roles) => {
        this.rolesSignal.set(roles);
      },
      onError: (message) => this.rolesErrorSignal.set(message),
    });
  }

  updateProject(
    projectId: string,
    request: UpdateProjectRequest,
    onSuccess?: (project: Project) => void,
    onError?: (message: string) => void,
  ): void {
    if (this.savingSignal() || this.deletingSignal()) return;
    this.requests.run({
      loading: this.savingSignal,
      request$: this.updateProjectUseCase.execute(projectId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Cập nhật dự án thất bại',
      onError,
      onSuccess: (updated) => {
        this.projectSignal.update((current) =>
          current?.id === projectId ? { ...current, ...updated } : current,
        );
        this.notifications.success('Cập nhật thông tin dự án thành công');
        onSuccess?.(updated);
      },
    });
  }

  addMembers(
    projectId: string,
    request: AddProjectMembersRequest,
    onSuccess?: (members: ProjectMember[]) => void,
    onError?: (message: string) => void,
  ): void {
    if (this.addingMemberSignal()) return;
    this.requests.run({
      loading: this.addingMemberSignal,
      request$: this.addProjectMembersUseCase.execute(projectId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Thêm thành viên thất bại',
      onError,
      onSuccess: (newMembers) => {
        // POST returns only newly added members; reload to also refresh existing leader roles.
        this.loadMembers(projectId);
        this.notifications.success('Thêm thành viên vào dự án thành công');
        onSuccess?.(newMembers);
      },
    });
  }

  deleteProject(
    projectId: string,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ): void {
    if (this.deletingSignal() || this.savingSignal()) return;
    this.requests.run({
      loading: this.deletingSignal,
      request$: this.deleteProjectUseCase.execute(projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Xóa dự án thất bại. Vui lòng thử lại.',
      onError,
      onSuccess: (deleted) => {
        if (deleted !== true) {
          const message = 'Xóa dự án thất bại. Vui lòng thử lại.';
          this.notifications.error(message);
          onError?.(message);
          return;
        }
        if (this.projectSignal()?.id === projectId) this.clear();
        this.notifications.success('Xóa dự án thành công');
        onSuccess?.();
      },
    });
  }

  createBoard(request: CreateBoardRequest, onSuccess?: (board: Board) => void): void {
    this.requests.run({
      loading: this.creatingBoardSignal,
      request$: this.createBoardUseCase.execute(request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Tạo bảng thất bại',
      onSuccess: (newBoard) => {
        this.boardsSignal.update((boards) => [newBoard, ...boards]);
        this.projectSignal.update((p) =>
          p ? { ...p, boardsCount: (p.boardsCount || 0) + 1 } : null,
        );
        this.notifications.success('Tạo bảng mới thành công');
        onSuccess?.(newBoard);
      },
    });
  }

  setMockProject(mock: Project, boards?: Board[], members?: ProjectMember[]): void {
    this.projectSignal.set(mock);
    if (boards) this.boardsSignal.set(boards);
    if (members) this.membersSignal.set(members);
  }

  clear(): void {
    this.cancel$.next();
    this.membersReadCancel$.next();
    this.projectSignal.set(null);
    this.boardsSignal.set([]);
    this.membersSignal.set([]);
    this.errorSignal.set(null);
  }
}
