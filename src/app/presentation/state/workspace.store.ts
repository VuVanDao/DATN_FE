import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { CreateWorkspaceRequest, Workspace } from '../../domain/models/workspace.model';
import { GetUserWorkspacesUseCase } from '../../application/workspace/get-user-workspaces.use-case';
import { CreateWorkspaceUseCase } from '../../application/workspace/create-workspace.use-case';
import { AuthStore } from './auth.store';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStore {
  private readonly _getUserWorkspacesUseCase = inject(GetUserWorkspacesUseCase);
  private readonly _createWorkspaceUseCase = inject(CreateWorkspaceUseCase);
  private readonly _authStore = inject(AuthStore);

  // States
  private readonly _workspaces = signal<Workspace[]>([]);
  // state loading của loadWorkspace
  private readonly _isLoading = signal<boolean>(false);
  // state loading của create workspace
  private readonly _isCreating = signal<boolean>(false);
  private readonly _hasLoaded = signal<boolean>(false);
  private readonly _selectedWorkspaceId = signal<string | null>(null);

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

  clear(): void {
    this._workspaces.set([]);
    this._hasLoaded.set(false);
    this._selectedWorkspaceId.set(null);
    this._isLoading.set(false);
    this._isCreating.set(false);
  }
}
