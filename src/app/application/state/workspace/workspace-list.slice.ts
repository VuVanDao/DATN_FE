import { computed, inject, Injectable, signal } from '@angular/core';
import { merge, Subject } from 'rxjs';
import {
  CreateWorkspaceRequest,
  Workspace,
  WorkspaceDetail,
} from '../../../domain/models/workspace.model';
import { NotificationService } from '../../shared/notification.service';
import { CreateWorkspaceUseCase } from '../../workspace/create-workspace.use-case';
import { DeleteWorkspaceUseCase } from '../../workspace/delete-workspace.use-case';
import { GetUserWorkspacesUseCase } from '../../workspace/get-user-workspaces.use-case';
import { LoadingFlags } from '../../../shared/utils/loading-flags.util';
import { StoreRequestRunner } from '../store-request.util';

/**
 * Concern: danh sách các workspace mà user đang tham gia.
 * Bao gồm tải danh sách, tạo mới, chọn workspace đang xem và xoá.
 */
@Injectable({
  providedIn: 'root',
})
export class WorkspaceListSlice {
  private readonly _cancel$ = new Subject<void>();
  private readonly _loadCancel$ = new Subject<void>();
  private readonly _notifications = inject(NotificationService);
  private readonly _requests = inject(StoreRequestRunner);
  private readonly _getUserWorkspacesUseCase = inject(GetUserWorkspacesUseCase);
  private readonly _createWorkspaceUseCase = inject(CreateWorkspaceUseCase);
  private readonly _deleteWorkspaceUseCase = inject(DeleteWorkspaceUseCase);

  private readonly _loading = new LoadingFlags();

  private readonly _workspaces = signal<Workspace[]>([]);
  private readonly _hasLoaded = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedWorkspaceId = signal<string | null>(null);

  private readonly _isLoading = this._loading.create('loadWorkspaces');
  private readonly _isCreating = this._loading.create('createWorkspace');
  private readonly _isDeletingWorkspace = this._loading.create('deleteWorkspace');

  readonly workspaces = this._workspaces.asReadonly();
  readonly hasLoaded = this._hasLoaded.asReadonly();
  readonly listError = this._error.asReadonly();
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
    if ((this._isLoading() || this._hasLoaded()) && !forceRefresh) {
      return;
    }
    this._loadCancel$.next();
    this._error.set(null);
    this._requests.run({
      loading: this._isLoading,
      cancel$: merge(this._cancel$, this._loadCancel$),
      request$: this._getUserWorkspacesUseCase.execute(),
      fallbackErrorMessage: 'Không thể tải danh sách không gian làm việc',
      // Giữ nguyên hành vi cũ: không toast để tránh hiện lỗi khi đang đăng xuất
      toastOnError: false,
      onSuccess: (workspaces) => {
        this._workspaces.set(workspaces);
        this._hasLoaded.set(true);
      },
      onError: (message) => this._error.set(message),
    });
  }

  /** Tạo mới không gian làm việc và đưa lên đầu danh sách ngay lập tức. */
  createWorkspace(
    request: CreateWorkspaceRequest,
    onSuccess?: (workspace: Workspace) => void,
    onError?: (errorMsg: string) => void,
  ): void {
    if (this._isCreating()) return;
    this._requests.run({
      loading: this._isCreating,
      cancel$: this._cancel$,
      request$: this._createWorkspaceUseCase.execute(request),
      fallbackErrorMessage: 'Tạo không gian làm việc thất bại. Vui lòng thử lại',
      onSuccess: (newWorkspace) => {
        this._notifications.success(`Tạo không gian làm việc "${newWorkspace.name}" thành công!`);
        this._workspaces.update((list) => [newWorkspace, ...list]);
        this._selectedWorkspaceId.set(newWorkspace.id);
        this.refreshPendingList();
        onSuccess?.(newWorkspace);
      },
      onError,
    });
  }

  selectWorkspace(id: string): void {
    this._selectedWorkspaceId.set(id);
  }

  deleteWorkspace(id: string, onSuccess?: () => void, onError?: (errorMsg: string) => void): void {
    if (this._isDeletingWorkspace()) return;
    this._requests.run({
      loading: this._isDeletingWorkspace,
      cancel$: this._cancel$,
      request$: this._deleteWorkspaceUseCase.execute(id),
      fallbackErrorMessage: 'Xóa không gian làm việc thất bại',
      onSuccess: () => {
        this._notifications.success('Xóa không gian làm việc thành công');
        this._workspaces.update((list) => list.filter((w) => w.id !== id));
        this.refreshPendingList();
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
            }
          : w,
      ),
    );
    this.refreshPendingList();
  }

  adjustCounts(id: string, members = 0, projects = 0): void {
    this._workspaces.update((items) =>
      items.map((workspace) =>
        workspace.id === id
          ? {
              ...workspace,
              membersCount: Math.max(0, workspace.membersCount + members),
              projectsCount: Math.max(0, workspace.projectsCount + projects),
            }
          : workspace,
      ),
    );
    this.refreshPendingList();
  }

  private refreshPendingList(): void {
    if (this._isLoading()) this.loadWorkspaces(true);
  }

  clear(): void {
    this._cancel$.next();
    this._loadCancel$.next();
    this._workspaces.set([]);
    this._hasLoaded.set(false);
    this._error.set(null);
    this._selectedWorkspaceId.set(null);
    this._loading.resetAll();
  }
}
