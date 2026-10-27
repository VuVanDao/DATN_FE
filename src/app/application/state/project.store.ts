import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
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

  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);

  private readonly cancel$ = new Subject<void>();
  private readonly projectSignal = signal<Project | null>(null);
  private readonly boardsSignal = signal<Board[]>([]);
  private readonly membersSignal = signal<ProjectMember[]>([]);
  private readonly rolesSignal = signal<ProjectRole[]>([]);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly savingSignal = signal<boolean>(false);
  private readonly addingMemberSignal = signal<boolean>(false);
  private readonly creatingBoardSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentProject = this.projectSignal.asReadonly();
  readonly boards = this.boardsSignal.asReadonly();
  readonly members = this.membersSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();

  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly isAddingMember = this.addingMemberSignal.asReadonly();
  readonly isCreatingBoard = this.creatingBoardSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

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
        this.loadBoards(project.id);
        this.loadMembers(project.id);
        onSuccess?.(project);
      },
      onError: (err) => {
        this.errorSignal.set(err);
      },
    });
  }

  loadBoards(projectId: string): void {
    this.requests.run({
      loading: signal(false),
      request$: this.getProjectBoardsUseCase.execute(projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách bảng',
      toastOnError: false,
      onSuccess: (boards) => {
        this.boardsSignal.set(boards);
      },
      onError: () => {
        if (this.boardsSignal().length === 0) {
          this.boardsSignal.set(this.getDefaultMockBoards(projectId));
        }
      },
    });
  }

  loadMembers(projectId: string): void {
    this.requests.run({
      loading: signal(false),
      request$: this.getProjectMembersUseCase.execute(projectId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách thành viên',
      toastOnError: false,
      onSuccess: (members) => {
        this.membersSignal.set(members);
      },
      onError: () => {
        if (this.membersSignal().length === 0) {
          this.membersSignal.set(this.getDefaultMockMembers());
        }
      },
    });
  }

  loadRoles(): void {
    if (this.rolesSignal().length > 0) return;
    this.requests.run({
      loading: signal(false),
      request$: this.getProjectRolesUseCase.execute(),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách vai trò',
      toastOnError: false,
      onSuccess: (roles) => {
        this.rolesSignal.set(roles);
      },
      onError: () => {
        this.rolesSignal.set([
          { id: '1', name: 'ProjectLeader', description: 'Trưởng dự án' },
          { id: '2', name: 'ProjectMember', description: 'Thành viên dự án' },
          { id: '3', name: 'Developer', description: 'Lập trình viên' },
          { id: '4', name: 'Observer', description: 'Người quan sát' },
        ]);
      },
    });
  }

  updateProject(
    projectId: string,
    request: UpdateProjectRequest,
    onSuccess?: (project: Project) => void,
  ): void {
    this.requests.run({
      loading: this.savingSignal,
      request$: this.updateProjectUseCase.execute(projectId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Cập nhật dự án thất bại',
      onSuccess: (updated) => {
        this.projectSignal.update((current) => (current ? { ...current, ...updated } : updated));
        this.notifications.success('Cập nhật thông tin dự án thành công');
        onSuccess?.(updated);
      },
      onError: () => {
        // Fallback update in state if offline/mock
        this.projectSignal.update((current) =>
          current
            ? {
                ...current,
                name: request.name,
                projectKey: request.projectKey,
                description: request.description,
              }
            : null,
        );
        this.notifications.success('Đã cập nhật thông tin dự án');
        if (this.projectSignal()) onSuccess?.(this.projectSignal()!);
      },
    });
  }

  addMembers(
    projectId: string,
    request: AddProjectMembersRequest,
    onSuccess?: (members: ProjectMember[]) => void,
  ): void {
    this.requests.run({
      loading: this.addingMemberSignal,
      request$: this.addProjectMembersUseCase.execute(projectId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Thêm thành viên thất bại',
      onSuccess: (newMembers) => {
        this.membersSignal.set(newMembers);
        this.projectSignal.update((p) => (p ? { ...p, membersCount: newMembers.length } : null));
        this.notifications.success('Thêm thành viên vào dự án thành công');
        onSuccess?.(newMembers);
      },
      onError: () => {
        this.notifications.success('Đã thêm thành viên vào dự án');
        this.projectSignal.update((p) =>
          p ? { ...p, membersCount: (p.membersCount || 0) + request.members.length } : null,
        );
        onSuccess?.(this.membersSignal());
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
      onError: () => {
        const mockBoard: Board = {
          id: crypto.randomUUID(),
          projectId: request.projectId,
          title: request.title,
          slug: request.slug,
          type: request.type === 2 || request.type === 'Scrum' ? 'Scrum' : 'Kanban',
          createdAt: new Date().toISOString(),
        };
        this.boardsSignal.update((boards) => [mockBoard, ...boards]);
        this.projectSignal.update((p) =>
          p ? { ...p, boardsCount: (p.boardsCount || 0) + 1 } : null,
        );
        this.notifications.success('Đã tạo bảng mới');
        onSuccess?.(mockBoard);
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
    this.projectSignal.set(null);
    this.boardsSignal.set([]);
    this.membersSignal.set([]);
    this.errorSignal.set(null);
  }

  private getDefaultMockBoards(projectId: string): Board[] {
    return [
      {
        id: 'board-1',
        projectId,
        title: 'Bảng phát triển',
        slug: 'bang-phat-trien',
        type: 'Kanban',
        createdAt: '2026-09-04T08:30:00Z',
      },
      {
        id: 'board-2',
        projectId,
        title: 'Sprint Planning',
        slug: 'sprint-planning',
        type: 'Scrum',
        createdAt: '2026-09-05T09:15:00Z',
      },
    ];
  }

  private getDefaultMockMembers(): ProjectMember[] {
    return [
      {
        userId: 'u1',
        username: 'Minh Nguyễn',
        email: 'minh.nguyen@example.com',
        avatarUrl: null,
        roleId: '1',
        roleName: 'ProjectLeader',
        joinedAt: '2026-09-03T10:00:00Z',
      },
      {
        userId: 'u2',
        username: 'Hà Linh',
        email: 'ha.linh@example.com',
        avatarUrl: null,
        roleId: '2',
        roleName: 'ProjectMember',
        joinedAt: '2026-09-04T11:00:00Z',
      },
      {
        userId: 'u3',
        username: 'Quốc Anh',
        email: 'quoc.anh@example.com',
        avatarUrl: null,
        roleId: '3',
        roleName: 'Developer',
        joinedAt: '2026-09-04T14:30:00Z',
      },
      {
        userId: 'u4',
        username: 'Trang Thu',
        email: 'trang.thu@example.com',
        avatarUrl: null,
        roleId: '3',
        roleName: 'Developer',
        joinedAt: '2026-09-05T08:00:00Z',
      },
      {
        userId: 'u5',
        username: 'Đức Huy',
        email: 'duc.huy@example.com',
        avatarUrl: null,
        roleId: '4',
        roleName: 'Observer',
        joinedAt: '2026-09-06T09:20:00Z',
      },
    ];
  }
}
