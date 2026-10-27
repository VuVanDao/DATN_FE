import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../../environments/environment';
import { SessionService } from '../../../../application/auth/session.service';
import { LayoutService } from '../../../../application/layout/layout.service';
import { NotificationService } from '../../../../application/shared/notification.service';
import { ProjectStore } from '../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../application/state/workspace.store';
import { Project, ProjectMember } from '../../../../domain/models/project.model';
import { Workspace } from '../../../../domain/models/workspace.model';
import { ProjectRepository } from '../../../../domain/repositories/project.repository';
import { WorkspaceRepository } from '../../../../domain/repositories/workspace.repository';
import { ProjectHttpRepository } from '../../../../infrastructure/repositories/project-http.repository';
import { WorkspaceHttpRepository } from '../../../../infrastructure/repositories/workspace-http.repository';
import { ProjectDetailPage } from './project-detail.page';

describe('Remove project members', () => {
  let fixture: ComponentFixture<ProjectDetailPage>;
  let store: ProjectStore;
  let http: HttpTestingController;
  const leaderId = '11111111-1111-1111-1111-111111111111';
  const memberId = '22222222-2222-2222-2222-222222222222';
  const ownerId = '33333333-3333-3333-3333-333333333333';
  const user = signal({ id: leaderId });
  const workspaces = signal<Workspace[]>([]);
  const workspace = { currentWorkspace: () => null, workspaces, onProjectMemberRemoved: vi.fn() };
  const notifications = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const project: Project = {
    id: '44444444-4444-4444-4444-444444444444',
    workspaceId: '55555555-5555-5555-5555-555555555555',
    name: 'Project',
    projectKey: 'APP',
    createdById: ownerId,
    createdByName: 'Owner',
    boardsCount: 0,
    membersCount: 2,
    sprintCount: 0,
    cardCount: 4,
    createdAt: '2026-10-27T01:00:00Z',
    isMember: true,
  };
  const leader: ProjectMember = {
    userId: leaderId,
    username: 'Leader',
    email: 'leader@example.com',
    roleId: 'leader-role',
    roleName: 'ProjectLeader',
    joinedAt: project.createdAt,
  };
  const member: ProjectMember = {
    userId: memberId,
    username: 'Member',
    email: 'member@example.com',
    roleId: 'member-role',
    roleName: 'ProjectMember',
    joinedAt: project.createdAt,
  };
  const membersUrl = `${environment.apiUrl}/project/${project.id}/members`;
  const deleteUrl = `${membersUrl}/${memberId}`;

  beforeEach(() => {
    vi.clearAllMocks();
    user.set({ id: leaderId });
    workspaces.set([]);
    const params = convertToParamMap({
      projectKey: project.projectKey,
      workspaceId: project.workspaceId,
    });
    const query = convertToParamMap({ workspaceSlug: 'team' });
    TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectRepository, useClass: ProjectHttpRepository },
        { provide: WorkspaceRepository, useClass: WorkspaceHttpRepository },
        { provide: WorkspaceStore, useValue: workspace },
        { provide: SessionService, useValue: { currentUser: user } },
        { provide: NotificationService, useValue: notifications },
        { provide: LayoutService, useValue: { setSidebar() {} } },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(params),
            queryParamMap: new BehaviorSubject(query),
            snapshot: { paramMap: params, queryParamMap: query },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(ProjectDetailPage);
    store = TestBed.inject(ProjectStore);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne(`${environment.apiUrl}/project/APP/workspace/${project.workspaceId}`)
      .flush({ data: project });
    http.expectOne(`${environment.apiUrl}/board/project/${project.id}`).flush({ data: [] });
    http.expectOne(membersUrl).flush({ data: [leader, member] });
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    store.clear();
    http.verify();
  });

  it('requires confirmation, sends one DELETE, reloads members and invalidates workspace project data', () => {
    const page = fixture.componentInstance;
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      `[aria-label="Xóa ${member.username} khỏi dự án"]`,
    );
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain(
      member.email,
    );
    http.expectNone(deleteUrl);
    store.loadMembers(project.id);
    const olderRead = http.expectOne(membersUrl);
    page.confirmRemoveMember();
    page.confirmRemoveMember();
    page.closeRemoveMember();
    expect(page.memberToRemove()).toEqual(member);
    expect(store.isRemovingMember()).toBe(true);
    const request = http.expectOne(deleteUrl);
    expect(request.request.method).toBe('DELETE');
    request.flush({ data: true });
    expect(olderRead.cancelled).toBe(true);
    expect(store.members()).toEqual([leader]);
    expect(store.currentProject()?.membersCount).toBe(1);
    http.expectOne(membersUrl).flush({ data: [leader] });
    expect(page.memberToRemove()).toBeNull();
    expect(workspace.onProjectMemberRemoved).toHaveBeenCalledExactlyOnceWith(project.workspaceId);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  for (const status of [0, 400, 403, 404, 500]) {
    it(`keeps the member and confirmation after HTTP ${status} and allows retry`, () => {
      const page = fixture.componentInstance;
      page.openRemoveMember(member);
      page.confirmRemoveMember();
      http
        .expectOne(deleteUrl)
        .flush({ message: 'Không thể xóa thành viên.' }, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
        'Không thể xóa thành viên.',
      );
      expect(store.members()).toEqual([leader, member]);
      expect(store.currentProject()?.membersCount).toBe(2);
      expect(page.memberToRemove()).toEqual(member);
      expect(store.isRemovingMember()).toBe(false);
      expect(notifications.success).not.toHaveBeenCalled();
      expect(workspace.onProjectMemberRemoved).not.toHaveBeenCalled();
      page.confirmRemoveMember();
      http.expectOne(deleteUrl).flush({ data: true });
      http.expectOne(membersUrl).flush({ data: [leader] });
      expect(store.members()).toEqual([leader]);
    });
  }

  it('lets a regular member leave and clears project state without reading members again', () => {
    user.set({ id: memberId });
    const page = fixture.componentInstance;
    expect(page.canRemoveMember(leader)).toBe(false);
    page.openRemoveMember(member);
    page.confirmRemoveMember();
    http.expectOne(deleteUrl).flush({ data: true });
    http.expectNone(membersUrl);
    expect(store.currentProject()).toBeNull();
    expect(store.members()).toEqual([]);
    expect(router.navigate).toHaveBeenCalledExactlyOnceWith(['/workspaces', 'team']);
    expect(workspace.onProjectMemberRemoved).toHaveBeenCalledWith(project.workspaceId);
  });

  it('honors owner, leader and self rules and blocks removing the leader', () => {
    const page = fixture.componentInstance;
    user.set({ id: memberId });
    expect(page.canRemoveMember({ ...member, userId: 'another-member' })).toBe(false);
    page.openRemoveMember(leader);
    expect(page.memberToRemove()).toBeNull();
    user.set({ id: ownerId });
    workspaces.set([{ id: project.workspaceId, ownerId } as Workspace]);
    expect(page.canRemoveMember(member)).toBe(true);
    expect(page.canRemoveMember(leader)).toBe(false);
    user.set({ id: leaderId });
    expect(page.canRemoveMember(member)).toBe(true);
    expect(page.canRemoveMember(leader)).toBe(false);
    http.expectNone(deleteUrl);
  });

  it('does not remove a member when the response is false', () => {
    const page = fixture.componentInstance;
    page.openRemoveMember(member);
    page.confirmRemoveMember();
    http.expectOne(deleteUrl).flush({ data: false });
    expect(store.members()).toEqual([leader, member]);
    expect(page.memberRemovalError()).toBeTruthy();
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it('cancels pending removal on navigation and does not call completion callbacks', () => {
    const page = fixture.componentInstance;
    page.openRemoveMember(member);
    page.confirmRemoveMember();
    const request = http.expectOne(deleteUrl);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
    expect(store.isRemovingMember()).toBe(false);
    expect(notifications.success).not.toHaveBeenCalled();
    expect(workspace.onProjectMemberRemoved).not.toHaveBeenCalled();
  });
});
