import { effect, inject, Injectable } from '@angular/core';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
  CreateWorkspaceRequest,
  MemberRemovalImpact,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
} from '../../domain/models/workspace.model';
import { CreateProjectRequest } from '../../domain/models/project.model';
import { AuthStore } from './auth.store';
import { WorkspaceListSlice } from './workspace/workspace-list.slice';
import { WorkspaceDetailSlice } from './workspace/workspace-detail.slice';
import { WorkspaceMemberSlice } from './workspace/workspace-member.slice';
import { ProjectSlice } from './workspace/project.slice';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStore {
  private readonly _list = inject(WorkspaceListSlice);
  private readonly _detail = inject(WorkspaceDetailSlice);
  private readonly _members = inject(WorkspaceMemberSlice);
  private readonly _project = inject(ProjectSlice);
  private readonly _authStore = inject(AuthStore);

  constructor() {
    // Tự động xóa toàn bộ state workspace khi user đăng xuất
    effect(() => {
      if (!this._authStore.isAuthenticated()) {
        this.clear();
      }
    });
  }

  // ===== Danh sách workspace =====
  readonly workspaces = this._list.workspaces;
  readonly isLoading = this._list.isLoading;
  readonly isCreating = this._list.isCreating;
  readonly isDeletingWorkspace = this._list.isDeletingWorkspace;
  readonly hasLoaded = this._list.hasLoaded;
  readonly totalCount = this._list.totalCount;
  readonly displayedWorkspaces = this._list.displayedWorkspaces;
  readonly selectedWorkspace = this._list.selectedWorkspace;

  // ===== Chi tiết workspace đang mở =====
  readonly currentWorkspace = this._detail.currentWorkspace;
  readonly isLoadingDetail = this._detail.isLoadingDetail;
  readonly isUpdating = this._detail.isUpdating;

  // ===== Thành viên & vai trò =====
  readonly workspaceRoles = this._members.workspaceRoles;
  readonly isAddingMembers = this._members.isAddingMembers;
  readonly isRemovingMember = this._members.isRemovingMember;
  readonly isLoadingMemberImpact = this._members.isLoadingMemberImpact;
  readonly memberRemovalImpact = this._members.memberRemovalImpact;
  readonly memberRemovalImpactError = this._members.memberRemovalImpactError;

  // ===== Dự án =====
  readonly isCreatingProject = this._project.isCreatingProject;

  loadWorkspaces(forceRefresh = false): void {
    this._list.loadWorkspaces(forceRefresh);
  }

  createWorkspace(
    request: CreateWorkspaceRequest,
    onSuccess?: (workspace: Workspace) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._list.createWorkspace(request, onSuccess, onError);
  }

  selectWorkspace(id: string): void {
    this._list.selectWorkspace(id);
  }

  /**
   * Xoá workspace và dọn luôn chi tiết đang mở nếu trùng id.
   * Đây là luồng cắt ngang 2 slice nên đặt ở facade thay vì trong slice danh sách
   * (slice danh sách không nên biết tới slice chi tiết).
   */
  deleteWorkspace(id: string, onSuccess?: () => void, onError?: (errorMsg: string) => void): void {
    this._list.deleteWorkspace(
      id,
      () => {
        this._detail.clearIfCurrent(id);
        onSuccess?.();
      },
      onError,
    );
  }

  getWorkspaceDetail(slug: string): void {
    this._detail.getWorkspaceDetail(slug);
  }

  updateWorkspace(
    id: string,
    request: UpdateWorkspaceRequest,
    onSuccess?: (workspace: WorkspaceDetail) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._detail.updateWorkspace(id, request, onSuccess, onError);
  }

  loadWorkspaceRoles(): void {
    this._members.loadWorkspaceRoles();
  }

  addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
    onSuccess?: (result: AddWorkspaceMembersResponse) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._members.addMembers(workspaceId, request, onSuccess, onError);
  }

  removeMember(
    workspaceId: string,
    memberId: string,
    onSuccess?: () => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._members.removeMember(workspaceId, memberId, onSuccess, onError);
  }

  getMemberRemovalImpact(
    workspaceId: string,
    memberId: string,
    onSuccess?: (impact: MemberRemovalImpact) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._members.getMemberRemovalImpact(workspaceId, memberId, onSuccess, onError);
  }

  clearMemberRemovalImpact(): void {
    this._members.clearMemberRemovalImpact();
  }

  createProject(request: CreateProjectRequest, onSuccess?: () => void): void {
    this._project.createProject(request, onSuccess);
  }

  clear(): void {
    this._list.clear();
    this._detail.clear();
    this._members.clear();
    this._project.clear();
  }
}
