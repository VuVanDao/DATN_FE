import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { WorkspaceMember, WorkspaceProject } from '../../../domain/models/workspace.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { ProjectRepository } from '../../../domain/repositories/project.repository';
import { WorkspaceRepository } from '../../../domain/repositories/workspace.repository';
import { SessionService } from '../../auth/session.service';
import { NotificationService } from '../../shared/notification.service';
import { WorkspaceStore } from '../workspace.store';

function page<T>(items: T[], pageIndex = 1, hasNextPage = false): PagedResult<T> {
  return {
    items,
    pageIndex,
    hasNextPage,
    pageSize: 20,
    totalCount: hasNextPage ? 40 : items.length,
    totalPages: hasNextPage ? 2 : 1,
    hasPreviousPage: pageIndex > 1,
  };
}

describe('Workspace tab cache', () => {
  let store: WorkspaceStore;
  let projects: Subject<PagedResult<WorkspaceProject>>[];
  let members: Subject<PagedResult<WorkspaceMember>>[];
  let getProjects: ReturnType<typeof vi.fn>;
  let getMembers: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    projects = [];
    members = [];
    getProjects = vi.fn(() => {
      const request = new Subject<PagedResult<WorkspaceProject>>();
      projects.push(request);
      return request;
    });
    getMembers = vi.fn(() => {
      const request = new Subject<PagedResult<WorkspaceMember>>();
      members.push(request);
      return request;
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WorkspaceRepository,
          useValue: {
            getProjects,
            getMembers,
            getWorkspaceBySlug: (id: string) =>
              of({
                id,
                slug: id,
                name: id,
                ownerId: 'owner',
                ownerName: 'Owner',
                createdAt: '',
                memberPreview: [],
                membersCount: 0,
              }),
            removeMember: vi.fn(() => of(true)),
          },
        },
        { provide: ProjectRepository, useValue: {} },
        {
          provide: SessionService,
          useValue: { ended$: new Subject<void>(), currentUser: () => ({ id: 'owner' }) },
        },
        { provide: NotificationService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });
    store = TestBed.inject(WorkspaceStore);
  });

  it('loads members lazily, deduplicates in-flight requests and caches empty results', () => {
    store.getWorkspaceDetail('a');
    expect(getMembers).not.toHaveBeenCalled();
    store.selectTab('members');
    store.selectTab('projects');
    store.selectTab('members');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(1);
    projects[0].next(page([]));
    projects[0].complete();
    members[0].next(page([]));
    members[0].complete();
    store.selectTab('projects');
    store.selectTab('members');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(1);
  });

  it('discards slow responses after workspace changes and clear', () => {
    store.getWorkspaceDetail('a');
    store.selectTab('members');
    store.getWorkspaceDetail('b');
    projects[0].next(page([], 1, true));
    members[0].next(page([]));
    expect(store.projects.loaded()).toBe(false);
    expect(store.members.loaded()).toBe(false);
    expect(store.projects.loading()).toBe(true);
    store.clearDetail();
    projects[1].next(page([]));
    expect(store.projects.loaded()).toBe(false);
    expect(store.projects.loading()).toBe(false);
  });

  it.each(['projects', 'members'] as const)(
    'retries failed %s pages without refetching completed pages',
    (tab) => {
      store.getWorkspaceDetail('a');
      store.selectTab(tab);
      const requests = tab === 'projects' ? projects : members;
      const get = tab === 'projects' ? getProjects : getMembers;
      requests[0].next(page([], 1, true));
      requests[0].complete();
      store.loadMore(tab);
      requests[1].error(new Error('offline'));
      expect(store[tab].error()).toBeTruthy();
      store.loadMore(tab);
      expect(get).toHaveBeenLastCalledWith('a', 2);
      requests[2].next(page([], 2));
      requests[2].complete();
      expect(store[tab].error()).toBeNull();
      expect(store[tab].hasMore()).toBe(false);
    },
  );

  it('invalidates active and hidden tabs and cancels stale pre-mutation reads', () => {
    store.getWorkspaceDetail('a');
    store.selectTab('members');
    store.removeMember('a', 'member');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(2);
    members[0].next(page([], 1, true));
    expect(store.members.loaded()).toBe(false);
    members[1].next(page([]));
    members[1].complete();
    store.selectTab('projects');
    expect(getProjects).toHaveBeenCalledTimes(2);
    store.removeMember('other', 'member');
    expect(getProjects).toHaveBeenCalledTimes(2);
  });
});
