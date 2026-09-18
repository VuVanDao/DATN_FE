import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Workspace } from '../../domain/models/workspace.model';
import { GetUserWorkspacesUseCase } from '../../application/workspace/get-user-workspaces.use-case';
import { AuthStore } from './auth.store';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceStore {
  private readonly _getUserWorkspacesUseCase = inject(GetUserWorkspacesUseCase);
  private readonly _authStore = inject(AuthStore);

  // States
  private readonly _workspaces = signal<Workspace[]>([]);
  private readonly _isLoading = signal<boolean>(false);
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
  readonly hasLoaded = this._hasLoaded.asReadonly();
  readonly totalCount = computed(() => this._workspaces().length);
  readonly displayedWorkspaces = computed(() => this._workspaces().slice(0, 3));
  readonly selectedWorkspace = computed(
    () => this._workspaces().find((w) => w.id === this._selectedWorkspaceId()) ?? this._workspaces()[0] ?? null,
  );

  loadWorkspaces(forceRefresh = false): void {
    if (this._isLoading()) {
      return;
    }
    // nếu đã tải danh sách workspace lên từ trước thì sẽ không tải lại trừ khi forceRefresh = true
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

  selectWorkspace(id: string): void {
    this._selectedWorkspaceId.set(id);
  }

  clear(): void {
    this._workspaces.set([]);
    this._hasLoaded.set(false);
    this._selectedWorkspaceId.set(null);
    this._isLoading.set(false);
  }
}
