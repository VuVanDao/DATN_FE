import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
  WorkspaceProject,
  WorkspaceRole,
  MemberRemovalImpact,
} from '../../domain/models/workspace.model';
import { GetUserWorkspacesUseCase } from '../../application/workspace/get-user-workspaces.use-case';
import { CreateWorkspaceUseCase } from '../../application/workspace/create-workspace.use-case';
import { AuthStore } from './auth.store';
import { toast } from 'ngx-sonner';
import { GetWorkspaceDetailUseCase } from '../../application/workspace/get-workspace-detail.use-case';
import { UpdateWorkspaceUsecase } from '../../application/workspace/update-workspace.use-case';
import { getWorkspaceRolesUsecase } from '../../application/workspace/get-workspace-roles.use-case';
import { AddMembersToWorksapceUsecase } from '../../application/workspace/Add-members-to-workspace.use-case';
import { DeleteWorkspaceUseCase } from '../../application/workspace/delete-workspace.use-case';
import { RemoveMemberFromWorkspaceUseCase } from '../../application/workspace/remove-member-from-workspace.use-case';
import { GetMemberRemovalImpactUseCase } from '../../application/workspace/get-member-removal-impact.use-case';
import { CreateProjectUsecase } from '../../application/project/create-project.use-case';
import { CreateProjectRequest } from '../../domain/models/project.model';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStore {
  private readonly _getUserWorkspacesUseCase = inject(GetUserWorkspacesUseCase);
  private readonly _createWorkspaceUseCase = inject(CreateWorkspaceUseCase);
  private readonly _getWorkspaceDetailUseCase = inject(GetWorkspaceDetailUseCase);
  private readonly _updateWorkspaceUseCase = inject(UpdateWorkspaceUsecase);
  private readonly _getWorkspaceRolesUseCase = inject(getWorkspaceRolesUsecase);
  private readonly _AddMembersToWorksapceUseCase = inject(AddMembersToWorksapceUsecase);
  private readonly _deleteWorkspaceUseCase = inject(DeleteWorkspaceUseCase);
  private readonly _removeMemberFromWorkspaceUseCase = inject(RemoveMemberFromWorkspaceUseCase);
  private readonly _getMemberRemovalImpactUseCase = inject(GetMemberRemovalImpactUseCase);
  //project
  private readonly _craeteProjectUseCase = inject(CreateProjectUsecase);
  private readonly _authStore = inject(AuthStore);

  // States
  // danh sách các workspace hiện có
  private readonly _workspaces = signal<Workspace[]>([]);
  // state loading của loadWorkspace
  private readonly _isLoading = signal<boolean>(false);
  // state loading của create workspace
  private readonly _isCreating = signal<boolean>(false);
  private readonly _hasLoaded = signal<boolean>(false);
  private readonly _selectedWorkspaceId = signal<string | null>(null);
  // state cho workspace detail for workspaceDetail page
  private readonly _currentWorkspace = signal<WorkspaceDetail | null>(null);
  private readonly _isLoadingDetail = signal<boolean>(false);
  private readonly _isUpdating = signal<boolean>(false);
  // state danh sach casc role co scope la workspace
  private readonly _workspaceRoles = signal<WorkspaceRole[]>([]);
  // state loading cho viec add member
  private readonly _isAddingMembers = signal<boolean>(false);
  // state loading cho viec delete workspace
  private readonly _isDeletingWorkspace = signal<boolean>(false);
  // state loading cho viec create project
  private readonly _isCreatingProject = signal<boolean>(false);
  // State loading cho việc xoá thành viên khỏi workspace
  private readonly _isRemovingMember = signal<boolean>(false);
  // State loading khi đang kiểm tra ảnh hưởng xoá thành viên
  private readonly _isLoadingMemberImpact = signal<boolean>(false);
  // State lưu trữ dữ liệu thông tin ảnh hưởng khi xoá thành viên
  private readonly _memberRemovalImpact = signal<MemberRemovalImpact | null>(null);
  // State lưu thông báo lỗi khi kiểm tra ảnh hưởng xoá thành viên
  private readonly _memberRemovalImpactError = signal<string | null>(null);

  constructor() {
    // Tự động xóa danh sách workspace khi user đăng xuất
    effect(() => {
      if (!this._authStore.isAuthenticated()) {
        this.clear();
      }
    });
  }

  // Readonly states & Computed
  readonly workspaces = this._workspaces.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly hasLoaded = this._hasLoaded.asReadonly();
  readonly totalCount = computed(() => this._workspaces().length);
  readonly displayedWorkspaces = computed(() => this._workspaces().slice(0, 3));
  readonly selectedWorkspace = computed(
    () =>
      this._workspaces().find((w) => w.id === this._selectedWorkspaceId()) ??
      this._workspaces()[0] ??
      null,
  );
  readonly currentWorkspace = this._currentWorkspace.asReadonly();
  readonly isLoadingDetail = this._isLoadingDetail.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly workspaceRoles = this._workspaceRoles.asReadonly();
  readonly isAddingMembers = this._isAddingMembers.asReadonly();
  readonly isDeletingWorkspace = this._isDeletingWorkspace.asReadonly();
  readonly isCreatingProject = this._isCreatingProject.asReadonly();
  readonly isRemovingMember = this._isRemovingMember.asReadonly();
  readonly isLoadingMemberImpact = this._isLoadingMemberImpact.asReadonly();
  readonly memberRemovalImpact = this._memberRemovalImpact.asReadonly();
  readonly memberRemovalImpactError = this._memberRemovalImpactError.asReadonly();

  loadWorkspaces(forceRefresh = false): void {
    if (this._isLoading()) {
      return;
    }
    // Nếu đã tải danh sách workspace từ trước thì không tải lại trừ khi forceRefresh = true
    if (this._hasLoaded() && !forceRefresh) {
      return;
    }

    this._isLoading.set(true);

    this._getUserWorkspacesUseCase.execute().subscribe({
      next: (workspaces) => {
        this._workspaces.set(workspaces);
        this._hasLoaded.set(true);
        this._isLoading.set(false);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Tạo mới Không gian làm việc
   */
  createWorkspace(
    request: CreateWorkspaceRequest,
    onSuccess?: (workspace: Workspace) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._isCreating.set(true);

    this._createWorkspaceUseCase.execute(request).subscribe({
      next: (newWorkspace) => {
        this._isCreating.set(false);
        // Đưa workspace mới vừa tạo lên đầu danh sách ngay lập tức
        this._workspaces.update((list) => [newWorkspace, ...list]);
        this._selectedWorkspaceId.set(newWorkspace.id);
        toast.success(`Tạo không gian làm việc "${newWorkspace.name}" thành công!`);
        if (onSuccess) {
          onSuccess(newWorkspace);
        }
      },
      error: (err) => {
        this._isCreating.set(false);
        const errorsList = err?.error?.errors;
        let detailedMsg: string | null = null;
        if (Array.isArray(errorsList) && errorsList.length > 0) {
          detailedMsg = errorsList[0];
        } else if (typeof errorsList === 'object' && errorsList !== null) {
          const firstKey = Object.keys(errorsList)[0];
          detailedMsg = errorsList[firstKey]?.[0];
        }
        const msg =
          detailedMsg ||
          err?.error?.message ||
          'Tạo không gian làm việc thất bại. Vui lòng thử lại';
        toast.error(msg);
        if (onError) {
          onError(msg);
        }
      },
    });
  }

  selectWorkspace(id: string): void {
    this._selectedWorkspaceId.set(id);
  }
  getWorkspaceDetail = (slug: string) => {
    this._isLoadingDetail.set(true);
    this._getWorkspaceDetailUseCase.execute(slug).subscribe({
      next: (res) => {
        this._currentWorkspace.set(res);
        this._isLoadingDetail.set(false);
        this._selectedWorkspaceId.set(res.id);
      },
      error: (err) => {
        this._isLoadingDetail.set(false);
        const msg = this.extractErrorMessage(err, 'Không thể tải thông tin không gian làm việc');
        toast.error(msg);
      },
    });
  };
  updateWorkspace = (
    id: string,
    request: UpdateWorkspaceRequest,
    onSuccess?: (workspace: WorkspaceDetail) => void,
    onError?: (errorMsg: string) => void,
  ) => {
    this._isUpdating.set(true);
    this._updateWorkspaceUseCase.execute(id, request).subscribe({
      next: (res) => {
        this._isUpdating.set(false);
        this._currentWorkspace.set(res);
        this._workspaces.update((list) => {
          return list.map((w) =>
            w.id === res.id
              ? {
                  ...w,
                  name: res.name,
                  slug: res.slug,
                  description: res.description,
                  logoUrl: res.logoUrl,
                  coverImageUrl: res.coverImageUrl,
                  initial: res.initial,
                  color: res.color,
                }
              : w,
          );
        });
        toast.success('Cập nhật không gian làm việc thành công');
        if (onSuccess) {
          onSuccess(res);
        }
      },
      error: (err) => {
        this._isUpdating.set(false);
        const msg = this.extractErrorMessage(err, 'Cập nhật không gian làm việc thất bại');
        toast.error(msg);
        if (onError) {
          onError(msg);
        }
      },
    });
  };
  loadWorkspaceRoles(): void {
    this._getWorkspaceRolesUseCase.execute().subscribe({
      next: (roles) => {
        this._workspaceRoles.set(roles);
      },
      error: (err) => {
        const msg = this.extractErrorMessage(err, 'Không thể tải danh sách vai trò');
        toast.error(msg);
      },
    });
  }
  addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
    onSuccess?: (result: AddWorkspaceMembersResponse) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._isAddingMembers.set(true);
    this._AddMembersToWorksapceUseCase.execute(workspaceId, request).subscribe({
      next: (result) => {
        this._isAddingMembers.set(false);
        const newMembers = result.results
          .filter((r) => r.success && r.member)
          .map((r) => r.member!);
        if (newMembers.length > 0) {
          this._currentWorkspace.update((ws) => {
            if (!ws) {
              return ws;
            }
            return {
              ...ws,
              members: [...ws.members, ...newMembers],
            };
          });
        }
        if (result.totalFailed === 0) {
          toast.success(`Đã thêm thành công ${result.totalSuccess} thành viên`);
        } else {
          toast.warning(
            `Thêm thành công ${result.totalSuccess}/${result.totalRequested} thành viên (${result.totalFailed} thất bại)`,
          );
        }
        if (onSuccess) {
          onSuccess(result);
        }
      },
      error: (err) => {
        this._isAddingMembers.set(false);
        const msg = this.extractErrorMessage(err, 'Thêm thành viên thất bại');
        toast.error(msg);
        if (onError) {
          onError(msg);
        }
      },
    });
  }
  deleteWorkspace(id: string, onSuccess?: () => void, onError?: (errorMsg: string) => void): void {
    this._isDeletingWorkspace.set(true);
    this._deleteWorkspaceUseCase.execute(id).subscribe({
      next: () => {
        this._isDeletingWorkspace.set(false);
        this._workspaces.update((list) => list.filter((w) => w.id !== id));
        if (this._currentWorkspace()?.id === id) {
          this._currentWorkspace.set(null);
        }
        toast.success('Xóa không gian làm việc thành công');
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this._isDeletingWorkspace.set(false);
        const msg = this.extractErrorMessage(err, 'Xóa không gian làm việc thất bại');
        toast.error(msg);
        if (onError) {
          onError(msg);
        }
      },
    });
  }
  createProject(request: CreateProjectRequest, onSuccess?: () => void): void {
    this._isCreatingProject.set(true);
    this._craeteProjectUseCase.execute(request).subscribe({
      next: (res) => {
        this._isCreatingProject.set(false);

        toast.success(`Dự án "${res.name}" đã được tạo thành công`);
        const currWs = this.currentWorkspace();
        if (currWs?.slug) {
          this.getWorkspaceDetail(currWs.slug);
        }
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this._isCreatingProject.set(false);
        const message = err?.error?.message || 'Tạo dự án thất bại, vui lòng thử lại.';
        toast.error(message);
      },
    });
  }
  removeMember(
    workspaceId: string,
    memberId: string,
    onSuccess?: () => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._isRemovingMember.set(true);

    this._removeMemberFromWorkspaceUseCase.execute(workspaceId, memberId).subscribe({
      next: () => {
        this._isRemovingMember.set(false);
        const currentUserId = this._authStore.currentUser()?.Id;
        const isSelf = currentUserId && memberId.toString() === currentUserId.toString();

        if (isSelf) {
          this._workspaces.update((list) => list.filter((w) => w.id !== workspaceId));
          if (this._currentWorkspace()?.id === workspaceId) {
            this._currentWorkspace.set(null);
          }
          this.loadWorkspaces(true);
        } else {
          this._currentWorkspace.update((ws) => {
            if (!ws) return ws;
            return {
              ...ws,
              members: ws.members.filter((m) => m.userId !== memberId),
            };
          });
          this._workspaces.update((list) =>
            list.map((w) =>
              w.id === workspaceId ? { ...w, membersCount: Math.max(0, w.membersCount - 1) } : w,
            ),
          );
        }

        toast.success(
          isSelf
            ? 'Bạn đã rời khỏi không gian làm việc thành công'
            : 'Đã xoá thành viên khỏi không gian làm việc thành công',
        );
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this._isRemovingMember.set(false);
        const msg = this.extractErrorMessage(err, 'Xóa thành viên thất bại');
        toast.error(msg);
        if (onError) {
          onError(msg);
        }
      },
    });
  }

  getMemberRemovalImpact(
    workspaceId: string,
    memberId: string,
    onSuccess?: (impact: MemberRemovalImpact) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._isLoadingMemberImpact.set(true);
    this._memberRemovalImpactError.set(null);
    this._memberRemovalImpact.set(null);
    this._getMemberRemovalImpactUseCase.execute(workspaceId, memberId).subscribe({
      next: (data) => {
        this._memberRemovalImpact.set(data);
        this._isLoadingMemberImpact.set(false);

        if (onSuccess) {
          onSuccess(data);
        }
      },
      error: (err) => {
        this._isLoadingMemberImpact.set(false);
        const errorMsg = this.extractErrorMessage(
          err,
          'Không thể kiểm tra thông tin ảnh hưởng của thành viên. Vui lòng thử lại sau.',
        );
        this._memberRemovalImpactError.set(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      },
    });
  }

  clearMemberRemovalImpact(): void {
    this._memberRemovalImpact.set(null);
    this._isLoadingMemberImpact.set(false);
    this._memberRemovalImpactError.set(null);
  }

  clear(): void {
    this._workspaces.set([]);
    this._hasLoaded.set(false);
    this._selectedWorkspaceId.set(null);
    this._isLoading.set(false);
    this._isCreating.set(false);
    this._currentWorkspace.set(null);
    this._isLoadingDetail.set(false);
    this._isUpdating.set(false);
    this._workspaceRoles.set([]);
    this._isAddingMembers.set(false);
    this._isDeletingWorkspace.set(false);
    this._isCreatingProject.set(false);
    this._isRemovingMember.set(false);
    this.clearMemberRemovalImpact();
  }
  private extractErrorMessage(err: any, defaultMsg: string): string {
    const errorsList = err?.error?.errors;
    if (Array.isArray(errorsList) && errorsList.length > 0) {
      return errorsList[0];
    } else if (typeof errorsList === 'object' && errorsList !== null) {
      const firstKey = Object.keys(errorsList)[0];
      if (firstKey && errorsList[firstKey]?.[0]) {
        return errorsList[firstKey][0];
      }
    }
    return err?.error?.message || defaultMsg;
  }
}
