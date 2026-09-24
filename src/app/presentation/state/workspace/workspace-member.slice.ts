import { inject, Injectable, signal } from '@angular/core';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResponse,
  MemberRemovalImpact,
  WorkspaceRole,
} from '../../../domain/models/workspace.model';
import { GetWorkspaceRolesUseCase } from '../../../application/workspace/get-workspace-roles.use-case';
import { AddMembersToWorkspaceUseCase } from '../../../application/workspace/add-members-to-workspace.use-case';
import { RemoveMemberFromWorkspaceUseCase } from '../../../application/workspace/remove-member-from-workspace.use-case';
import { GetMemberRemovalImpactUseCase } from '../../../application/workspace/get-member-removal-impact.use-case';
import { toast } from 'ngx-sonner';
import { AuthStore } from '../auth.store';
import { runStoreRequest } from '../store-request.util';
import { LoadingFlags } from '../loading-flags.util';
import { WorkspaceListSlice } from './workspace-list.slice';
import { WorkspaceDetailSlice } from './workspace-detail.slice';

/**
 * Concern: thành viên & vai trò trong workspace.
 * Bao gồm danh sách vai trò, thêm thành viên, xoá/rời thành viên và kiểm tra
 * ảnh hưởng trước khi xoá.
 */
@Injectable({
  providedIn: 'root',
})
export class WorkspaceMemberSlice {
  private readonly _getWorkspaceRolesUseCase = inject(GetWorkspaceRolesUseCase);
  private readonly _addMembersToWorkspaceUseCase = inject(AddMembersToWorkspaceUseCase);
  private readonly _removeMemberFromWorkspaceUseCase = inject(RemoveMemberFromWorkspaceUseCase);
  private readonly _getMemberRemovalImpactUseCase = inject(GetMemberRemovalImpactUseCase);
  private readonly _authStore = inject(AuthStore);
  private readonly _list = inject(WorkspaceListSlice);
  private readonly _detail = inject(WorkspaceDetailSlice);

  private readonly _loading = new LoadingFlags();

  private readonly _workspaceRoles = signal<WorkspaceRole[]>([]);
  private readonly _memberRemovalImpact = signal<MemberRemovalImpact | null>(null);
  private readonly _memberRemovalImpactError = signal<string | null>(null);

  private readonly _isLoadingRoles = this._loading.create('loadWorkspaceRoles');
  private readonly _isAddingMembers = this._loading.create('addMembers');
  private readonly _isRemovingMember = this._loading.create('removeMember');
  private readonly _isLoadingMemberImpact = this._loading.create('getMemberRemovalImpact');

  readonly workspaceRoles = this._workspaceRoles.asReadonly();
  readonly memberRemovalImpact = this._memberRemovalImpact.asReadonly();
  readonly memberRemovalImpactError = this._memberRemovalImpactError.asReadonly();
  readonly isAddingMembers = this._isAddingMembers.asReadonly();
  readonly isRemovingMember = this._isRemovingMember.asReadonly();
  readonly isLoadingMemberImpact = this._isLoadingMemberImpact.asReadonly();

  /** Danh sách vai trò có scope là workspace. */
  loadWorkspaceRoles(): void {
    if (this._isLoadingRoles()) {
      return;
    }

    runStoreRequest({
      loading: this._isLoadingRoles,
      request$: this._getWorkspaceRolesUseCase.execute(),
      fallbackErrorMessage: 'Không thể tải danh sách vai trò',
      onSuccess: (roles) => this._workspaceRoles.set(roles),
    });
  }

  addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
    onSuccess?: (result: AddWorkspaceMembersResponse) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    runStoreRequest({
      loading: this._isAddingMembers,
      request$: this._addMembersToWorkspaceUseCase.execute(workspaceId, request),
      fallbackErrorMessage: 'Thêm thành viên thất bại',
      onSuccess: (result) => {
        const newMembers = result.results
          .filter((r) => r.success && r.member)
          .map((r) => r.member!);
        if (newMembers.length > 0) {
          this._detail.appendMembers(newMembers);
        }

        if (result.totalFailed === 0) {
          toast.success(`Đã thêm thành công ${result.totalSuccess} thành viên`);
        } else {
          toast.warning(
            `Thêm thành công ${result.totalSuccess}/${result.totalRequested} thành viên (${result.totalFailed} thất bại)`,
          );
        }
        onSuccess?.(result);
      },
      onError,
    });
  }

  removeMember(
    workspaceId: string,
    memberId: string,
    onSuccess?: () => void,
    onError?: (errorMsg: string) => void,
  ): void {
    runStoreRequest({
      loading: this._isRemovingMember,
      request$: this._removeMemberFromWorkspaceUseCase.execute(workspaceId, memberId),
      fallbackErrorMessage: 'Xóa thành viên thất bại',
      onSuccess: () => {
        const currentUserId = this._authStore.currentUser()?.id;
        const isSelf = !!currentUserId && memberId.toString() === currentUserId.toString();

        if (isSelf) {
          // Tự rời khỏi workspace: bỏ khỏi danh sách và tải lại để đồng bộ quyền
          this._list.removeWorkspaceLocally(workspaceId);
          this._detail.clearIfCurrent(workspaceId);
          this._list.loadWorkspaces(true);
        } else {
          this._detail.removeMemberLocally(memberId);
          this._list.decrementMembersCount(workspaceId);
        }

        toast.success(
          isSelf
            ? 'Bạn đã rời khỏi không gian làm việc thành công'
            : 'Đã xoá thành viên khỏi không gian làm việc thành công',
        );
        onSuccess?.();
      },
      onError,
    });
  }

  /** Kiểm tra ảnh hưởng trước khi xoá thành viên (dự án đang làm leader, card đang nhận...). */
  getMemberRemovalImpact(
    workspaceId: string,
    memberId: string,
    onSuccess?: (impact: MemberRemovalImpact) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    this._memberRemovalImpact.set(null);
    this._memberRemovalImpactError.set(null);

    runStoreRequest({
      loading: this._isLoadingMemberImpact,
      request$: this._getMemberRemovalImpactUseCase.execute(workspaceId, memberId),
      fallbackErrorMessage:
        'Không thể kiểm tra thông tin ảnh hưởng của thành viên. Vui lòng thử lại sau.',
      // Modal tự hiển thị lỗi trong nội dung nên không cần toast
      toastOnError: false,
      onSuccess: (impact) => {
        this._memberRemovalImpact.set(impact);
        onSuccess?.(impact);
      },
      onError: (message) => {
        this._memberRemovalImpactError.set(message);
        onError?.(message);
      },
    });
  }

  clearMemberRemovalImpact(): void {
    this._memberRemovalImpact.set(null);
    this._isLoadingMemberImpact.set(false);
    this._memberRemovalImpactError.set(null);
  }

  clear(): void {
    this._workspaceRoles.set([]);
    this.clearMemberRemovalImpact();
    this._loading.resetAll();
  }
}
