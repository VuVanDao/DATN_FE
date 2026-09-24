import { inject, Injectable, signal } from '@angular/core';
import {
  UpdateWorkspaceRequest,
  WorkspaceDetail,
  WorkspaceMember,
} from '../../../domain/models/workspace.model';
import { GetWorkspaceDetailUseCase } from '../../../application/workspace/get-workspace-detail.use-case';
import { UpdateWorkspaceUseCase } from '../../../application/workspace/update-workspace.use-case';
import { toast } from 'ngx-sonner';
import { runStoreRequest } from '../store-request.util';
import { LoadingFlags } from '../loading-flags.util';
import { WorkspaceListSlice } from './workspace-list.slice';

/**
 * Concern: chi tiết của workspace đang mở (tab Dự án / Thành viên / Cài đặt).
 * Bao gồm tải chi tiết và cập nhật thông tin workspace.
 */
@Injectable({
  providedIn: 'root',
})
export class WorkspaceDetailSlice {
  private readonly _getWorkspaceDetailUseCase = inject(GetWorkspaceDetailUseCase);
  private readonly _updateWorkspaceUseCase = inject(UpdateWorkspaceUseCase);
  private readonly _list = inject(WorkspaceListSlice);

  private readonly _loading = new LoadingFlags();

  private readonly _currentWorkspace = signal<WorkspaceDetail | null>(null);

  private readonly _isLoadingDetail = this._loading.create('getWorkspaceDetail');
  private readonly _isUpdating = this._loading.create('updateWorkspace');

  readonly currentWorkspace = this._currentWorkspace.asReadonly();
  readonly isLoadingDetail = this._isLoadingDetail.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();

  getWorkspaceDetail(slug: string): void {
    runStoreRequest({
      loading: this._isLoadingDetail,
      request$: this._getWorkspaceDetailUseCase.execute(slug),
      fallbackErrorMessage: 'Không thể tải thông tin không gian làm việc',
      onSuccess: (res) => {
        this._currentWorkspace.set(res);
        this._list.selectWorkspace(res.id);
      },
    });
  }

  updateWorkspace(
    id: string,
    request: UpdateWorkspaceRequest,
    onSuccess?: (workspace: WorkspaceDetail) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    runStoreRequest({
      loading: this._isUpdating,
      request$: this._updateWorkspaceUseCase.execute(id, request),
      fallbackErrorMessage: 'Cập nhật không gian làm việc thất bại',
      onSuccess: (res) => {
        toast.success('Cập nhật không gian làm việc thành công');
        this._currentWorkspace.set(res);
        // Giữ danh sách workspace bên sidebar đồng bộ với dữ liệu vừa cập nhật
        this._list.patchWorkspaceSummary(res);
        onSuccess?.(res);
      },
      onError,
    });
  }

  /** Thêm thành viên mới vào chi tiết workspace đang mở. */
  appendMembers(members: WorkspaceMember[]): void {
    this._currentWorkspace.update((ws) =>
      ws ? { ...ws, members: [...ws.members, ...members] } : ws,
    );
  }

  /** Loại một thành viên khỏi chi tiết workspace đang mở. */
  removeMemberLocally(memberId: string): void {
    this._currentWorkspace.update((ws) =>
      ws ? { ...ws, members: ws.members.filter((m) => m.userId !== memberId) } : ws,
    );
  }

  /** Xoá chi tiết đang mở nếu nó trùng với workspace vừa bị xoá hoặc vừa rời khỏi. */
  clearIfCurrent(id: string): void {
    if (this._currentWorkspace()?.id === id) {
      this._currentWorkspace.set(null);
    }
  }

  clear(): void {
    this._currentWorkspace.set(null);
    this._loading.resetAll();
  }
}
