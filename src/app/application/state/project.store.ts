import { inject, Injectable, signal } from '@angular/core';
import { merge, Subject } from 'rxjs';
import {
  AddProjectMembersRequest,
  Board,
  CreateBoardRequest,
  Project,
  ProjectMember,
  ProjectRole,
  UpdateProjectMemberRoleRequest,
  UpdateProjectRequest,
} from '../../domain/models/project.model';
import { AddProjectMembersUseCase } from '../project/add-project-members.use-case';
import { CreateBoardUseCase } from '../project/create-board.use-case';
import { DeleteProjectUseCase } from '../project/delete-project.use-case';
import { GetProjectBoardsUseCase } from '../project/get-project-boards.use-case';
import { GetProjectDetailUseCase } from '../project/get-project-detail.use-case';
import { GetProjectMembersUseCase } from '../project/get-project-members.use-case';
import { GetProjectRolesUseCase } from '../project/get-project-roles.use-case';
import { RemoveProjectMemberUseCase } from '../project/remove-project-member.use-case';
import { UpdateBoardPreferenceUseCase } from '../board/update-board-preference.use-case';
import { UpdateProjectMemberRoleUseCase } from '../project/update-project-member-role.use-case';
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
  private readonly removeProjectMemberUseCase = inject(RemoveProjectMemberUseCase);
  private readonly updateProjectMemberRoleUseCase = inject(UpdateProjectMemberRoleUseCase);
  private readonly updateBoardPreferenceUseCase = inject(UpdateBoardPreferenceUseCase);

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
  private readonly removingMemberSignal = signal(false); // trạng thái đang xóa thành viên dự án
  private readonly updatingMemberRoleSignal = signal(false); // trạng thái đang cập nhật vai trò thành viên
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
  readonly isRemovingMember = this.removingMemberSignal.asReadonly();
  readonly isUpdatingMemberRole = this.updatingMemberRoleSignal.asReadonly();
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
    if (this.addingMemberSignal() || this.removingMemberSignal() || this.deletingSignal()) return;
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
    if (this.deletingSignal() || this.savingSignal() || this.removingMemberSignal()) return;
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

  toggleBoardPin(board: Board): void {
    const nextPinned = !board.isPinned;
    const previousPinned = !!board.isPinned;

    // Cập nhật lạc quan (optimistic update) trên UI ngay lập tức
    this.boardsSignal.update((boards) =>
      boards.map((b) => (b.id === board.id ? { ...b, isPinned: nextPinned } : b)),
    );

    this.updateBoardPreferenceUseCase.execute(board.id, { isPinned: nextPinned }).subscribe({
      next: (pref) => {
        this.boardsSignal.update((boards) =>
          boards.map((b) =>
            b.id === board.id
              ? { ...b, isPinned: pref.isPinned, lastViewedAt: pref.lastViewedAt }
              : b,
          ),
        );
        this.notifications.success(
          nextPinned ? 'Đã ghim bảng vào danh sách ưu tiên' : 'Đã bỏ ghim bảng',
        );
      },
      error: () => {
        // Hoàn tác cập nhật lạc quan khi gặp lỗi
        this.boardsSignal.update((boards) =>
          boards.map((b) => (b.id === board.id ? { ...b, isPinned: previousPinned } : b)),
        );
        this.notifications.error('Không thể cập nhật tùy chọn ghim bảng. Vui lòng thử lại.');
      },
    });
  }

  markBoardViewed(boardId: string): void {
    this.updateBoardPreferenceUseCase.execute(boardId, { markViewed: true }).subscribe({
      next: (pref) => {
        this.boardsSignal.update((boards) =>
          boards.map((b) => (b.id === boardId ? { ...b, lastViewedAt: pref.lastViewedAt } : b)),
        );
      },
      error: () => {
        // Silent fallback cho lượt xem
      },
    });
  }

  removeMember(
    projectId: string,
    userId: string,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ): void {
    if (this.removingMemberSignal() || this.addingMemberSignal() || this.deletingSignal()) return;
    this.requests.run({
      loading: this.removingMemberSignal,
      request$: this.removeProjectMemberUseCase.execute(projectId, userId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể xóa thành viên khỏi dự án. Vui lòng thử lại.',
      onError,
      onSuccess: (removed) => {
        if (removed !== true) {
          const message = 'Không thể xóa thành viên khỏi dự án. Vui lòng thử lại.';
          this.notifications.error(message);
          onError?.(message);
          return;
        }
        if (this.projectSignal()?.id === projectId) {
          this.membersReadCancel$.next(); // Hủy request lấy danh sách thành viên cũ đang chạy
          this.membersSignal.update((members) =>
            members.filter((member) => member.userId !== userId),
          ); // Loại người vừa xóa khỏi danh sách local.
          this.projectSignal.update((project) =>
            project ? { ...project, membersCount: Math.max(0, project.membersCount - 1) } : project,
          ); // giảm số lượng thành viên trong dự án
        }
        this.notifications.success('Đã xóa thành viên khỏi dự án');
        onSuccess?.();
        // The page clears project state when the current user leaves, so do not read it again.
        if (this.projectSignal()?.id === projectId) this.loadMembers(projectId);
      },
    });
  }

  /**
   * Cập nhật vai trò thành viên trong dự án (chuyển giao Leader / đổi role).
   * Sau khi thành công, reload lại toàn bộ danh sách thành viên vì khi chuyển giao
   * Leader, BE tự hạ vai trò Leader cũ xuống ProjectMember.
   */
  updateMemberRole(
    projectId: string,
    userId: string,
    request: UpdateProjectMemberRoleRequest,
    onSuccess?: (updated: ProjectMember) => void,
    onError?: (message: string) => void,
  ): void {
    if (
      this.updatingMemberRoleSignal() ||
      this.removingMemberSignal() ||
      this.addingMemberSignal() ||
      this.deletingSignal()
    )
      return;
    this.requests.run({
      loading: this.updatingMemberRoleSignal,
      request$: this.updateProjectMemberRoleUseCase.execute(projectId, userId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Cập nhật vai trò thành viên thất bại. Vui lòng thử lại.',
      onError,
      onSuccess: (updated) => {
        // Reload toàn bộ danh sách vì khi chuyển giao Leader, BE đồng thời hạ Leader cũ
        this.loadMembers(projectId);
        this.notifications.success(
          `Đã cập nhật vai trò của ${updated.username} thành ${updated.roleName === 'ProjectLeader' ? 'Trưởng dự án' : 'Thành viên'}`,
        );
        onSuccess?.(updated);
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
