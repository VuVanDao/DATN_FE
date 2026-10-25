import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateProjectRequest } from '../../domain/models/project.model';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResult,
  CreateWorkspaceRequest,
  MemberRemovalImpact,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
} from '../../domain/models/workspace.model';
import { SessionService } from '../auth/session.service';
import { NotificationService } from '../shared/notification.service';
import { ProjectSlice } from './workspace/project.slice';
import { WorkspaceDetailSlice } from './workspace/workspace-detail.slice';
import { WorkspaceListSlice } from './workspace/workspace-list.slice';
import { WorkspaceMemberSlice } from './workspace/workspace-member.slice';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStore {
  private readonly _list = inject(WorkspaceListSlice); // danh sách workspace
  private readonly _detail = inject(WorkspaceDetailSlice); // thông tin chi tiết workspace đang mở
  private readonly _members = inject(WorkspaceMemberSlice); // danh sách thành viên và vai trò trong workspace
  private readonly _project = inject(ProjectSlice); // quản lý dự án trong workspace
  private readonly _session = inject(SessionService);
  private readonly _notifications = inject(NotificationService);

  constructor() {
    this._session.ended$.pipe(takeUntilDestroyed()).subscribe(() => this.clear());
  }

  // ===== Danh sách workspace =====
  readonly workspaces = this._list.workspaces;
  readonly isLoading = this._list.isLoading;
  readonly isCreating = this._list.isCreating;
  readonly isDeletingWorkspace = this._list.isDeletingWorkspace;
  readonly hasLoaded = this._list.hasLoaded;
  readonly listError = this._list.listError;
  readonly totalCount = this._list.totalCount;
  readonly displayedWorkspaces = this._list.displayedWorkspaces;
  readonly selectedWorkspace = this._list.selectedWorkspace;

  // ===== Chi tiết workspace đang mở =====
  readonly currentWorkspace = this._detail.currentWorkspace;
  readonly isLoadingDetail = this._detail.isLoadingDetail;
  readonly isUpdating = this._detail.isUpdating;
  readonly detailError = this._detail.detailError;

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
        const isCurrent = this._detail.currentWorkspace()?.id === id;
        this._detail.clearIfCurrent(id);
        if (isCurrent) onSuccess?.();
      },
      onError,
    );
  }

  getWorkspaceDetail(slug: string): void {
    this._members.clearMemberRemovalImpact();
    this._detail.getWorkspaceDetail(slug, (workspace) => this._list.selectWorkspace(workspace.id));
  }

  updateWorkspace(
    id: string,
    request: UpdateWorkspaceRequest,
    onSuccess?: (workspace: WorkspaceDetail) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._detail.updateWorkspace(
      id,
      request,
      (workspace) => {
        this._list.patchWorkspaceSummary(workspace);
        this._notifications.success('Cập nhật không gian làm việc thành công');
        if (this._detail.currentWorkspace()?.id === id) onSuccess?.(workspace);
      },
      onError,
    );
  }

  loadWorkspaceRoles(): void {
    this._members.loadWorkspaceRoles();
  }

  addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
    onSuccess?: (result: AddWorkspaceMembersResult) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._members.addMembers(
      workspaceId,
      request,
      (result) => {
        const members = result.results.flatMap((item) =>
          item.success && item.member ? [item.member] : [],
        );
        this._detail.appendMembers(workspaceId, members);
        this._list.adjustCounts(workspaceId, result.totalSuccess);
        if (result.totalFailed === 0)
          this._notifications.success('Đã thêm thành công ' + result.totalSuccess + ' thành viên');
        else
          this._notifications.warning(
            'Thêm thành công ' +
              result.totalSuccess +
              '/' +
              result.totalRequested +
              ' thành viên (' +
              result.totalFailed +
              ' thất bại)',
          );
        if (this._detail.currentWorkspace()?.id === workspaceId) onSuccess?.(result);
      },
      onError,
    );
  }

  removeMember(
    workspaceId: string,
    memberId: string,
    onSuccess?: () => void,
    onError?: (errorMsg: string) => void,
  ): void {
    const isSelf = memberId.toLowerCase() === this._session.currentUser()?.id.toLowerCase();
    this._members.removeMember(
      workspaceId,
      memberId,
      () => {
        const isCurrent = this._detail.currentWorkspace()?.id === workspaceId;
        if (isSelf) {
          this._list.removeWorkspaceLocally(workspaceId);
          this._detail.clearIfCurrent(workspaceId);
          this._list.loadWorkspaces(true);
        } else {
          this._detail.removeMemberLocally(workspaceId, memberId);
          this._list.adjustCounts(workspaceId, -1);
        }
        this._notifications.success(
          isSelf
            ? 'Bạn đã rời khỏi không gian làm việc thành công'
            : 'Đã xoá thành viên khỏi không gian làm việc thành công',
        );
        if (isCurrent) onSuccess?.();
      },
      onError,
    );
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
    this._project.createProject(request, (project) => {
      this._list.adjustCounts(request.workspaceId, 0, 1);
      this._notifications.success('Dự án "' + project.name + '" đã được tạo thành công');
      const current = this._detail.currentWorkspace();
      if (current?.id === request.workspaceId) {
        onSuccess?.();
        this.getWorkspaceDetail(current.slug);
      }
    });
  }

  clearDetail(): void {
    this._detail.clearView();
    this._members.clearMemberRemovalImpact();
  }

  clear(): void {
    this._list.clear();
    this._detail.clear();
    this._members.clear();
    this._project.clear();
  }
}
