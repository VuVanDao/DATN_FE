import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CreateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
} from '../../../domain/models/workspace.model';
import { GetUserWorkspacesUseCase } from '../../../application/workspace/get-user-workspaces.use-case';
import { CreateWorkspaceUseCase } from '../../../application/workspace/create-workspace.use-case';
import { DeleteWorkspaceUseCase } from '../../../application/workspace/delete-workspace.use-case';
import { toast } from 'ngx-sonner';
import { runStoreRequest } from '../store-request.util';
import { LoadingFlags } from '../loading-flags.util';

/**
 * Concern: danh sách các workspace mà user đang tham gia.
 * Bao gồm tải danh sách, tạo mới, chọn workspace đang xem và xoá.
 */
@Injectable({
  providedIn: 'root',
})
export class WorkspaceListSlice {
  private readonly _getUserWorkspacesUseCase = inject(GetUserWorkspacesUseCase);
  private readonly _createWorkspaceUseCase = inject(CreateWorkspaceUseCase);
  private readonly _deleteWorkspaceUseCase = inject(DeleteWorkspaceUseCase);

  private readonly _loading = new LoadingFlags();

  private readonly _workspaces = signal<Workspace[]>([]);
  private readonly _hasLoaded = signal<boolean>(false);
  private readonly _selectedWorkspaceId = signal<string | null>(null);

  private readonly _isLoading = this._loading.create('loadWorkspaces');
  private readonly _isCreating = this._loading.create('createWorkspace');
  private readonly _isDeletingWorkspace = this._loading.create('deleteWorkspace');

  readonly workspaces = this._workspaces.asReadonly();
  readonly hasLoaded = this._hasLoaded.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly isDeletingWorkspace = this._isDeletingWorkspace.asReadonly();

  readonly totalCount = computed(() => this._workspaces().length);
  readonly displayedWorkspaces = computed(() => this._workspaces().slice(0, 3));
  readonly selectedWorkspace = computed(
    () =>
      this._workspaces().find((w) => w.id === this._selectedWorkspaceId()) ??
      this._workspaces()[0] ??
      null,
  );

  loadWorkspaces(forceRefresh = false): void {
    // Đang tải thì bỏ qua; đã tải rồi thì chỉ tải lại khi forceRefresh = true
    if (this._isLoading() || (this._hasLoaded() && !forceRefresh)) {
      return;
    }

    runStoreRequest({
      loading: this._isLoading,
      request$: this._getUserWorkspacesUseCase.execute(),
      fallbackErrorMessage: 'Không thể tải danh sách không gian làm việc',
      // Giữ nguyên hành vi cũ: không toast để tránh hiện lỗi khi đang đăng xuất
      toastOnError: false,
      onSuccess: (workspaces) => {
        this._workspaces.set(workspaces);
        this._hasLoaded.set(true);
      },
    });
  }

  /** Tạo mới không gian làm việc và đưa lên đầu danh sách ngay lập tức. */
  createWorkspace(
    request: CreateWorkspaceRequest,
    onSuccess?: (workspace: Workspace) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    runStoreRequest({
      loading: this._isCreating,
      request$: this._createWorkspaceUseCase.execute(request),
      fallbackErrorMessage: 'Tạo không gian làm việc thất bại. Vui lòng thử lại',
      onSuccess: (newWorkspace) => {
        toast.success(`Tạo không gian làm việc "${newWorkspace.name}" thành công!`);
        this._workspaces.update((list) => [newWorkspace, ...list]);
        this._selectedWorkspaceId.set(newWorkspace.id);
        onSuccess?.(newWorkspace);
      },
      onError,
    });
  }

  selectWorkspace(id: string): void {
    this._selectedWorkspaceId.set(id);
  }

  deleteWorkspace(
    id: string,
    onSuccess?: () => void,
    onError?: (errorMsg: string) => void,
  ): void {
    runStoreRequest({
      loading: this._isDeletingWorkspace,
      request$: this._deleteWorkspaceUseCase.execute(id),
      fallbackErrorMessage: 'Xóa không gian làm việc thất bại',
      onSuccess: () => {
        toast.success('Xóa không gian làm việc thành công');
        this._workspaces.update((list) => list.filter((w) => w.id !== id));
        onSuccess?.();
      },
      onError,
    });
  }

  /** Loại một workspace khỏi danh sách cục bộ (dùng khi user tự rời khỏi workspace). */
  removeWorkspaceLocally(id: string): void {
    this._workspaces.update((list) => list.filter((w) => w.id !== id));
  }

  /** Đồng bộ các trường tóm tắt của một workspace trong danh sách sau khi cập nhật chi tiết. */
  patchWorkspaceSummary(updated: WorkspaceDetail): void {
    this._workspaces.update((list) =>
      list.map((w) =>
        w.id === updated.id
          ? {
              ...w,
              name: updated.name,
              slug: updated.slug,
              description: updated.description,
              logoUrl: updated.logoUrl,
              coverImageUrl: updated.coverImageUrl,
              initial: updated.initial,
              color: updated.color,
            }
          : w,
      ),
    );
  }

  /** Giảm số lượng thành viên hiển thị của một workspace trong danh sách. */
  decrementMembersCount(id: string): void {
    this._workspaces.update((list) =>
      list.map((w) =>
        w.id === id ? { ...w, membersCount: Math.max(0, w.membersCount - 1) } : w,
      ),
    );
  }

  clear(): void {
    this._workspaces.set([]);
    this._hasLoaded.set(false);
    this._selectedWorkspaceId.set(null);
    this._loading.resetAll();
  }
}
