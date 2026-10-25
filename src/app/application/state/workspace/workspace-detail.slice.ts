import { inject, Injectable, signal } from '@angular/core';
import { merge, Subject } from 'rxjs';
import {
  UpdateWorkspaceRequest,
  WorkspaceDetail,
  WorkspaceMember,
} from '../../../domain/models/workspace.model';
import { GetWorkspaceDetailUseCase } from '../../workspace/get-workspace-detail.use-case';
import { UpdateWorkspaceUseCase } from '../../workspace/update-workspace.use-case';
import { StoreRequestRunner } from '../store-request.util';

@Injectable({ providedIn: 'root' })
export class WorkspaceDetailSlice {
  private readonly requests = inject(StoreRequestRunner);
  private readonly getDetail = inject(GetWorkspaceDetailUseCase);
  private readonly update = inject(UpdateWorkspaceUseCase);
  private readonly cancel$ = new Subject<void>();
  private readonly readCancel$ = new Subject<void>();
  private readonly workspace = signal<WorkspaceDetail | null>(null);
  private readonly loading = signal(false);
  private readonly updating = signal(false);
  private readonly error = signal<string | null>(null);

  readonly currentWorkspace = this.workspace.asReadonly();
  readonly isLoadingDetail = this.loading.asReadonly();
  readonly isUpdating = this.updating.asReadonly();
  readonly detailError = this.error.asReadonly();

  getWorkspaceDetail(slug: string, onSuccess?: (workspace: WorkspaceDetail) => void): void {
    this.readCancel$.next();
    this.workspace.set(null);
    this.error.set(null);
    this.requests.run({
      loading: this.loading,
      request$: this.getDetail.execute(slug),
      cancel$: merge(this.readCancel$, this.cancel$),
      fallbackErrorMessage: 'Không thể tải thông tin không gian làm việc',
      toastOnError: false,
      onSuccess: (workspace) => {
        this.workspace.set(workspace);
        onSuccess?.(workspace);
      },
      onError: (message) => this.error.set(message),
    });
  }

  updateWorkspace(
    id: string,
    request: UpdateWorkspaceRequest,
    onSuccess?: (workspace: WorkspaceDetail) => void,
    onError?: (message: string) => void,
  ): void {
    if (this.updating()) return;
    this.requests.run({
      loading: this.updating,
      request$: this.update.execute(id, request),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Cập nhật không gian làm việc thất bại',
      onSuccess: (workspace) => {
        if (this.workspace()?.id === id) this.workspace.set(workspace);
        onSuccess?.(workspace);
      },
      onError,
    });
  }

  appendMembers(workspaceId: string, members: WorkspaceMember[]): void {
    this.workspace.update((workspace) => {
      if (workspace?.id !== workspaceId) return workspace;
      const existing = new Set(workspace.members.map((member) => member.userId));
      return {
        ...workspace,
        members: [
          ...workspace.members,
          ...members.filter((member) => !existing.has(member.userId)),
        ],
      };
    });
  }

  removeMemberLocally(workspaceId: string, memberId: string): void {
    this.workspace.update((workspace) =>
      workspace?.id === workspaceId
        ? {
            ...workspace,
            members: workspace.members.filter((member) => member.userId !== memberId),
          }
        : workspace,
    );
  }

  clearIfCurrent(id: string): void {
    if (this.workspace()?.id === id) this.clearView();
  }

  clearView(): void {
    this.readCancel$.next();
    this.workspace.set(null);
    this.error.set(null);
  }

  clear(): void {
    this.cancel$.next();
    this.clearView();
  }
}
