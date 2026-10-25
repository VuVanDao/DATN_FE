import { inject, Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WorkspaceMember, WorkspaceProject } from '../../../domain/models/workspace.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { GetWorkspaceContentUseCase } from '../../workspace/get-workspace-content.use-case';
import { StoreRequestRunner } from '../store-request.util';

export type WorkspaceTab = 'projects' | 'members' | 'settings';

// Lives above tab components: switching tabs keeps completed pages and in-flight reads.
export class WorkspaceTabState<T> {
  private readonly cancel$ = new Subject<void>();
  private readonly itemsState = signal<T[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly totalState = signal(0);
  private readonly hasMoreState = signal(false);
  private pageIndex = 0;
  readonly items = this.itemsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loaded = this.loadedState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly totalCount = this.totalState.asReadonly();
  readonly hasMore = this.hasMoreState.asReadonly();

  constructor(
    private readonly runner: StoreRequestRunner,
    private readonly fetch: (id: string, page: number) => Observable<PagedResult<T>>,
  ) {}

  load(id: string, more = false): void {
    if (this.loading() || (!more && this.loaded()) || (more && !this.hasMore())) return;
    this.errorState.set(null);
    const page = more ? this.pageIndex + 1 : 1;
    this.runner.run({
      loading: this.loadingState,
      request$: this.fetch(id, page),
      cancel$: this.cancel$,
      fallbackErrorMessage: 'Không thể tải danh sách. Vui lòng thử lại.',
      toastOnError: false,
      onSuccess: (result) => {
        this.itemsState.update((items) => (more ? [...items, ...result.items] : result.items));
        this.totalState.set(result.totalCount);
        this.hasMoreState.set(result.hasNextPage);
        this.pageIndex = result.pageIndex;
        this.loadedState.set(true);
      },
      onError: (message) => this.errorState.set(message),
    });
  }

  clear(): void {
    this.cancel$.next();
    this.itemsState.set([]);
    this.loadedState.set(false);
    this.errorState.set(null);
    this.totalState.set(0);
    this.hasMoreState.set(false);
    this.pageIndex = 0;
  }
}

@Injectable({ providedIn: 'root' })
export class WorkspaceContentSlice {
  private readonly runner = inject(StoreRequestRunner);
  private readonly get = inject(GetWorkspaceContentUseCase);
  readonly projects = new WorkspaceTabState<WorkspaceProject>(this.runner, this.get.getProjects);
  readonly members = new WorkspaceTabState<WorkspaceMember>(this.runner, this.get.getMembers);
  private workspaceId: string | null = null;
  private activeTab: WorkspaceTab = 'projects';

  open(id: string): void {
    if (id !== this.workspaceId) this.clear();
    this.workspaceId = id;
    this.selectTab(this.activeTab);
  }

  selectTab(tab: WorkspaceTab): void {
    this.activeTab = tab;
    if (this.workspaceId && tab !== 'settings') this[tab].load(this.workspaceId);
  }

  loadMore(tab: 'projects' | 'members'): void {
    if (this.workspaceId) this[tab].load(this.workspaceId, true);
  }

  invalidate(id: string, ...tabs: ('projects' | 'members')[]): void {
    if (id !== this.workspaceId) return;
    tabs.forEach((tab) => this[tab].clear());
    if (tabs.some((tab) => tab === this.activeTab)) this.selectTab(this.activeTab);
  }

  clear(): void {
    this.projects.clear();
    this.members.clear();
    this.workspaceId = null;
    this.activeTab = 'projects';
  }
}
