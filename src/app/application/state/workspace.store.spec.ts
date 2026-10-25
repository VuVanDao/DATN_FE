import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import {
  AddWorkspaceMembersResult,
  MemberRemovalImpact,
  Workspace,
  WorkspaceDetail,
} from '../../domain/models/workspace.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { SessionService } from '../auth/session.service';
import { NotificationService } from '../shared/notification.service';
import { WorkspaceStore } from './workspace.store';

const member = {
  userId: 'member',
  username: 'Member',
  email: 'member@test.local',
  roleId: 'role',
  roleName: 'WorkspaceMember',
  joinAt: '',
};
function detail(id: string): WorkspaceDetail {
  return {
    id,
    slug: id,
    name: id,
    ownerId: 'owner',
    ownerName: 'Owner',
    createdAt: '',
    members: [],
    projects: [],
  };
}
function summary(id: string): Workspace {
  return { ...detail(id), membersCount: 1, projectsCount: 0 };
}

describe('WorkspaceStore request ownership', () => {
  let store: WorkspaceStore;
  let ended$: Subject<void>;
  let loads: Map<string, Subject<WorkspaceDetail>>;
  let list$: Subject<Workspace[]>;
  let added$: Subject<AddWorkspaceMembersResult>;
  let removed$: Subject<boolean>;
  let updated$: Subject<WorkspaceDetail>;
  let impacts: Subject<MemberRemovalImpact>[];

  beforeEach(() => {
    ended$ = new Subject();
    loads = new Map();
    list$ = new Subject();
    added$ = new Subject();
    removed$ = new Subject();
    updated$ = new Subject();
    impacts = [];
    const repository = {
      getUserWorkspaces: vi.fn(() => list$),
      getWorkspaceBySlug: vi.fn((slug: string) => {
        const request = new Subject<WorkspaceDetail>();
        loads.set(slug, request);
        return request;
      }),
      addMembers: vi.fn(() => added$),
      removeMember: vi.fn(() => removed$),
      updateWorkspace: vi.fn(() => updated$),
      getMemberRemovalImpact: vi.fn(() => {
        const request = new Subject<MemberRemovalImpact>();
        impacts.push(request);
        return request;
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: WorkspaceRepository, useValue: repository },
        {
          provide: ProjectRepository,
          useValue: { createProject: vi.fn(() => of({ id: 'project', name: 'Project' })) },
        },
        { provide: SessionService, useValue: { ended$, currentUser: signal({ id: 'owner' }) } },
        {
          provide: NotificationService,
          useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
        },
      ],
    });
    store = TestBed.inject(WorkspaceStore);
  });

  function open(id: string): void {
    store.getWorkspaceDetail(id);
    loads.get(id)!.next(detail(id));
    loads.get(id)!.complete();
  }

  it('keeps B when a slow request for A finishes later', () => {
    store.getWorkspaceDetail('a');
    const a = loads.get('a')!;
    open('b');
    a.next(detail('a'));
    expect(store.currentWorkspace()?.id).toBe('b');
    expect(store.isLoadingDetail()).toBe(false);
  });

  it('does not display A under the URL for B when B fails', () => {
    open('a');
    store.getWorkspaceDetail('b');
    loads.get('b')!.error(new Error('offline'));
    expect(store.currentWorkspace()).toBeNull();
    expect(store.detailError()).toBeTruthy();
    expect(store.isLoadingDetail()).toBe(false);
  });

  it('applies membership results only to the target workspace', () => {
    store.loadWorkspaces();
    list$.next([summary('a'), summary('b')]);
    list$.complete();
    open('a');
    const onSuccess = vi.fn();
    store.addMembers('a', { members: [] }, onSuccess);
    open('b');
    added$.next({
      totalRequested: 1,
      totalSuccess: 1,
      totalFailed: 0,
      results: [{ email: member.email, success: true, member }],
    });
    added$.complete();
    expect(store.currentWorkspace()?.members).toEqual([]);
    expect(store.workspaces().find((workspace) => workspace.id === 'a')?.membersCount).toBe(2);
    expect(store.workspaces().find((workspace) => workspace.id === 'b')?.membersCount).toBe(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('does not replace B with the result of updating A', () => {
    open('a');
    const onSuccess = vi.fn();
    store.updateWorkspace('a', { name: 'Updated A' }, onSuccess);
    open('b');
    updated$.next({ ...detail('a'), name: 'Updated A' });
    updated$.complete();
    expect(store.currentWorkspace()?.id).toBe('b');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('does not remove a member from B when removal in A finishes', () => {
    open('a');
    store.removeMember('a', member.userId);
    store.getWorkspaceDetail('b');
    loads.get('b')!.next({ ...detail('b'), members: [member] });
    removed$.next(true);
    removed$.complete();
    expect(store.currentWorkspace()?.members).toEqual([member]);
  });

  it('cancels impact requests when closing or changing the target member', () => {
    store.getMemberRemovalImpact('a', 'first');
    store.getMemberRemovalImpact('a', 'second');
    impacts[0].next({
      memberId: 'first',
      isProjectLeader: true,
      assignedCardsCount: 0,
      leaderProjects: [],
    });
    expect(store.memberRemovalImpact()).toBeNull();
    expect(store.isLoadingMemberImpact()).toBe(true);
    store.clearMemberRemovalImpact();
    impacts[1].next({
      memberId: 'second',
      isProjectLeader: false,
      assignedCardsCount: 0,
      leaderProjects: [],
    });
    expect(store.memberRemovalImpact()).toBeNull();
    expect(store.isLoadingMemberImpact()).toBe(false);
  });

  it('cancels outstanding reads and writes synchronously on logout', () => {
    store.loadWorkspaces();
    open('a');
    store.updateWorkspace('a', { name: 'Updated' });
    ended$.next();
    list$.next([summary('a')]);
    updated$.next(detail('a'));
    expect(store.workspaces()).toEqual([]);
    expect(store.currentWorkspace()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.isUpdating()).toBe(false);
  });

  it('restarts a pending list read after a mutation so stale summaries cannot overwrite it', () => {
    const refreshed$ = new Subject<Workspace[]>();
    const repository = TestBed.inject(WorkspaceRepository);
    vi.mocked(repository.getUserWorkspaces)
      .mockReturnValueOnce(list$)
      .mockReturnValueOnce(refreshed$);
    store.loadWorkspaces();
    open('a');
    store.updateWorkspace('a', { name: 'Updated A' });
    updated$.next({ ...detail('a'), name: 'Updated A' });
    updated$.complete();
    list$.next([summary('a')]);
    list$.complete();
    expect(store.isLoading()).toBe(true);
    refreshed$.next([{ ...summary('a'), name: 'Updated A' }]);
    refreshed$.complete();
    expect(store.workspaces()[0].name).toBe('Updated A');
    expect(store.isLoading()).toBe(false);
  });

  it('refreshes the correct workspace after project creation', () => {
    store.loadWorkspaces();
    list$.next([summary('a')]);
    list$.complete();
    open('a');
    const onSuccess = vi.fn();
    store.createProject({ workspaceId: 'a', name: 'Project', projectKey: 'PR' }, onSuccess);
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(store.isLoadingDetail()).toBe(true);
    expect(store.workspaces()[0].projectsCount).toBe(1);
  });
});
