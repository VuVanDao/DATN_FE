import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateProjectRequest, Project } from '../../domain/models/project.model';
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
import { WorkspaceProjectsSlice } from './workspace/workspace-projects.slice';
import { WorkspaceDetailSlice } from './workspace/workspace-detail.slice';
import { WorkspaceListSlice } from './workspace/workspace-list.slice';
import { WorkspaceMemberSlice } from './workspace/workspace-member.slice';

export type WorkspaceTab = 'projects' | 'members' | 'settings';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStore {
  private readonly _list = inject(WorkspaceListSlice); // danh sách workspace
  private readonly _detail = inject(WorkspaceDetailSlice); // thông tin chi tiết workspace đang mở
  private readonly _members = inject(WorkspaceMemberSlice); // danh sách thành viên và vai trò trong workspace
  private readonly _projects = inject(WorkspaceProjectsSlice); // danh sách và thao tác dự án trong workspace
  private readonly _session = inject(SessionService);
  private readonly _notifications = inject(NotificationService);
  private workspaceId: string | null = null;
  private activeTab: WorkspaceTab = 'projects';

  readonly members = this._members.members;
  readonly projects = this._projects.projects;

  selectTab(tab: WorkspaceTab): void {
    this.activeTab = tab;
    if (this.workspaceId && tab !== 'settings') this[tab].load(this.workspaceId);
  }

  loadMore(tab: 'projects' | 'members'): void {
    if (this.workspaceId) this[tab].load(this.workspaceId, true);
  }

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
  readonly isCreatingProject = this._projects.isCreatingProject;

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
        if (isCurrent) {
          this.clearTabLists();
          onSuccess?.();
        }
      },
      onError,
    );
  }

  getWorkspaceDetail(slug: string): void {
    this.clearTabLists();
    this._members.clearMemberRemovalImpact();
    this._detail.getWorkspaceDetail(slug, (workspace) => {
      this._list.selectWorkspace(workspace.id);
      this.workspaceId = workspace.id;
      this.selectTab(this.activeTab);
    });
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
        if (result.totalSuccess > 0) {
          this.invalidateTabLists(workspaceId, 'members');
          this._detail.refreshSummary(workspaceId);
        }
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
          if (isCurrent) this.clearTabLists();
          this._list.loadWorkspaces(true);
        } else {
          this.invalidateTabLists(workspaceId, 'members', 'projects');
          this._detail.refreshSummary(workspaceId);
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
    this._projects.createProject(request, (project) => {
      this._list.adjustCounts(request.workspaceId, 0, 1);
      this._notifications.success('Dự án "' + project.name + '" đã được tạo thành công');
      const current = this._detail.currentWorkspace();
      if (current?.id === request.workspaceId) {
        onSuccess?.();
        this.invalidateTabLists(current.id, 'projects');
      }
    });
  }

  patchProject(project: Project): void {
    this._projects.patchProject(project);
  }

  onProjectDeleted(workspaceId: string): void {
    this._list.adjustCounts(workspaceId, 0, -1); // giảm số lượng dự án trong danh sách dự án đang được cache workspace
    this.invalidateTabLists(workspaceId, 'projects'); // vô hiệu hoá danh sách dự án cũ của workspace này
  }

  clearDetail(): void {
    this.clearTabLists();
    this._detail.clearView();
    this._members.clearMemberRemovalImpact();
  }

  clear(): void {
    this.clearTabLists();
    this._list.clear();
    this._detail.clear();
    this._members.clear();
    this._projects.clear();
  }

  private invalidateTabLists(id: string, ...tabs: ('projects' | 'members')[]): void {
    if (id !== this.workspaceId) return;
    tabs.forEach((tab) => this[tab].clear());
    if (tabs.some((tab) => tab === this.activeTab)) this.selectTab(this.activeTab);
  }

  private clearTabLists(): void {
    this.members.clear();
    this.projects.clear();
    this.workspaceId = null;
    this.activeTab = 'projects';
  }
}
