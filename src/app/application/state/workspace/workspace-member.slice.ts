import { inject, Injectable, signal } from '@angular/core';
import { merge, Subject } from 'rxjs';
import {
  AddWorkspaceMembersRequest,
  AddWorkspaceMembersResult,
  MemberRemovalImpact,
  WorkspaceRole,
} from '../../../domain/models/workspace.model';
import { InviteWorkspaceMembersUseCase } from '../../workspace/invite-workspace-members.use-case';
import { GetMemberRemovalImpactUseCase } from '../../workspace/get-member-removal-impact.use-case';
import { GetWorkspaceRolesUseCase } from '../../workspace/get-workspace-roles.use-case';
import { RemoveMemberFromWorkspaceUseCase } from '../../workspace/remove-member-from-workspace.use-case';
import { LoadingFlags } from '../../../shared/utils/loading-flags.util';
import { StoreRequestRunner } from '../store-request.util';

@Injectable({ providedIn: 'root' })
export class WorkspaceMemberSlice {
  private readonly requests = inject(StoreRequestRunner);
  private readonly getRoles = inject(GetWorkspaceRolesUseCase);
  private readonly add = inject(InviteWorkspaceMembersUseCase);
  private readonly remove = inject(RemoveMemberFromWorkspaceUseCase);
  private readonly getImpact = inject(GetMemberRemovalImpactUseCase);

  private readonly cancel$ = new Subject<void>();
  private readonly impactCancel$ = new Subject<void>();
  private readonly loading = new LoadingFlags();
  private readonly roles = signal<WorkspaceRole[]>([]);
  private readonly impact = signal<MemberRemovalImpact | null>(null);
  private readonly impactError = signal<string | null>(null);
  private readonly loadingRoles = this.loading.create('roles');
  private readonly adding = this.loading.create('add');
  private readonly removing = this.loading.create('remove');
  private readonly loadingImpact = this.loading.create('impact');

  readonly workspaceRoles = this.roles.asReadonly();
  readonly memberRemovalImpact = this.impact.asReadonly();
  readonly memberRemovalImpactError = this.impactError.asReadonly();
  readonly isAddingMembers = this.adding.asReadonly();
  readonly isRemovingMember = this.removing.asReadonly();
  readonly isLoadingMemberImpact = this.loadingImpact.asReadonly();

  loadWorkspaceRoles(): void {
    if (this.loadingRoles() || this.roles().length) return;
    this.requests.run({
      loading: this.loadingRoles,
      request$: this.getRoles.execute(),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách vai trò',
      onSuccess: (roles) => this.roles.set(roles),
    });
  }

  addMembers(
    workspaceId: string,
    request: AddWorkspaceMembersRequest,
    onSuccess?: (result: AddWorkspaceMembersResult) => void,
    onError?: (message: string) => void,
  ): void {
    if (this.adding()) return;
    this.requests.run({
      loading: this.adding,
      request$: this.add.execute(workspaceId, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Thêm thành viên thất bại',
      onSuccess,
      onError,
    });
  }

  removeMember(
    workspaceId: string,
    memberId: string,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ): void {
    if (this.removing()) return;
    this.requests.run({
      loading: this.removing,
      request$: this.remove.execute(workspaceId, memberId),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Xóa thành viên thất bại',
      onSuccess,
      onError,
    });
  }

  getMemberRemovalImpact(
    workspaceId: string,
    memberId: string,
    onSuccess?: (impact: MemberRemovalImpact) => void,
    onError?: (message: string) => void,
  ): void {
    this.clearMemberRemovalImpact();
    this.requests.run({
      loading: this.loadingImpact,
      request$: this.getImpact.execute(workspaceId, memberId),
      cancel$: merge(this.impactCancel$, this.cancel$),
      fallbackErrorMessage:
        'Không thể kiểm tra thông tin ảnh hưởng của thành viên. Vui lòng thử lại sau.',
      toastOnError: false,
      onSuccess: (impact) => {
        this.impact.set(impact);
        onSuccess?.(impact);
      },
      onError: (message) => {
        this.impactError.set(message);
        onError?.(message);
      },
    });
  }

  clearMemberRemovalImpact(): void {
    this.impactCancel$.next();
    this.impact.set(null);
    this.impactError.set(null);
  }

  clear(): void {
    this.cancel$.next();
    this.roles.set([]);
    this.clearMemberRemovalImpact();
  }
}
