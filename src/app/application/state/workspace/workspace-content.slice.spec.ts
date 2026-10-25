import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { WorkspaceMember, WorkspaceProject } from '../../../domain/models/workspace.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { GetWorkspaceContentUseCase } from '../../workspace/get-workspace-content.use-case';
import { NotificationService } from '../../shared/notification.service';
import { WorkspaceContentSlice } from './workspace-content.slice';

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
  let content: WorkspaceContentSlice;
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
        { provide: GetWorkspaceContentUseCase, useValue: { getProjects, getMembers } },
        { provide: NotificationService, useValue: { error: vi.fn() } },
      ],
    });
    content = TestBed.inject(WorkspaceContentSlice);
  });

  it('loads members lazily, deduplicates in-flight requests and caches empty results', () => {
    content.open('a');
    expect(getMembers).not.toHaveBeenCalled();
    content.selectTab('members');
    content.selectTab('projects');
    content.selectTab('members');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(1);
    projects[0].next(page([]));
    projects[0].complete();
    members[0].next(page([]));
    members[0].complete();
    content.selectTab('projects');
    content.selectTab('members');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(1);
  });

  it('discards slow responses after workspace changes and clear', () => {
    content.open('a');
    content.selectTab('members');
    content.open('b');
    projects[0].next(page([], 1, true));
    members[0].next(page([]));
    expect(content.projects.loaded()).toBe(false);
    expect(content.members.loaded()).toBe(false);
    expect(content.projects.loading()).toBe(true);
    content.clear();
    projects[1].next(page([]));
    expect(content.projects.loaded()).toBe(false);
    expect(content.projects.loading()).toBe(false);
  });

  it('retries failed pages without refetching completed pages', () => {
    content.open('a');
    projects[0].next(page([], 1, true));
    projects[0].complete();
    content.loadMore('projects');
    projects[1].error(new Error('offline'));
    expect(content.projects.error()).toBeTruthy();
    content.loadMore('projects');
    expect(getProjects).toHaveBeenLastCalledWith('a', 2);
    projects[2].next(page([], 2));
    projects[2].complete();
    expect(content.projects.error()).toBeNull();
    expect(content.projects.hasMore()).toBe(false);
  });

  it('invalidates active and hidden tabs and cancels stale pre-mutation reads', () => {
    content.open('a');
    content.selectTab('members');
    content.invalidate('a', 'projects', 'members');
    expect(getProjects).toHaveBeenCalledTimes(1);
    expect(getMembers).toHaveBeenCalledTimes(2);
    members[0].next(page([], 1, true));
    expect(content.members.loaded()).toBe(false);
    members[1].next(page([]));
    members[1].complete();
    content.selectTab('projects');
    expect(getProjects).toHaveBeenCalledTimes(2);
    content.invalidate('other', 'projects');
    expect(getProjects).toHaveBeenCalledTimes(2);
  });
});
