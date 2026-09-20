import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
  WorkspaceRole,
} from '../../domain/models/workspace.model';
import { GetUserWorkspacesUseCase } from '../../application/workspace/get-user-workspaces.use-case';
import { CreateWorkspaceUseCase } from '../../application/workspace/create-workspace.use-case';
import { AuthStore } from './auth.store';
import { toast } from 'ngx-sonner';
import { GetWorkspaceDetailUseCase } from '../../application/workspace/get-workspace-detail.use-case';
import { UpdateWorkspaceUsecase } from '../../application/workspace/update-workspace.use-case';
import { getWorkspaceRolesUsecase } from '../../application/workspace/get-workspace-roles.use-case';
import { AddMembersToWorksapceUsecase } from '../../application/workspace/Add-members-to-workspace.use-case';

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
  readonly isAddingMember = this._isAddingMembers.asReadonly();

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
  clear(): void {
    this._workspaces.set([]);
    this._hasLoaded.set(false);
    this._selectedWorkspaceId.set(null);
    this._isLoading.set(false);
    this._isCreating.set(false);
    this._currentWorkspace.set(null);
    this._isLoadingDetail.set(false);
    this._isUpdating.set(false);
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
