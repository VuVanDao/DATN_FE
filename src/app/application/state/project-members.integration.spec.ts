import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Project, ProjectMember } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { ProjectHttpRepository } from '../../infrastructure/repositories/project-http.repository';
import { NotificationService } from '../shared/notification.service';
import { ProjectStore } from './project.store';

describe('Project member additions', () => {
  let store: ProjectStore;
  let http: HttpTestingController;
  const notifications = { success: vi.fn(), error: vi.fn() };
  const project: Project = {
    id: '11111111-1111-1111-1111-111111111111',
    workspaceId: '22222222-2222-2222-2222-222222222222',
    name: 'Project',
    projectKey: 'APP',
    createdById: '33333333-3333-3333-3333-333333333333',
    createdByName: 'Creator',
    boardsCount: 1,
    membersCount: 5,
    sprintCount: 0,
    cardCount: 0,
    createdAt: '2026-10-27T01:00:00Z',
  };
  const member = (index: number, roleName = 'ProjectMember'): ProjectMember => ({
    userId: `44444444-4444-4444-4444-${String(index).padStart(12, '0')}`,
    username: `Member ${index}`,
    email: `member${index}@example.com`,
    roleId:
      roleName === 'ProjectLeader'
        ? '55555555-5555-5555-5555-555555555551'
        : '55555555-5555-5555-5555-555555555552',
    roleName,
    joinedAt: '2026-10-27T01:00:00Z',
  });
  const existing = [member(1, 'ProjectLeader'), member(2), member(3), member(4), member(5)];
  const added = [member(6, 'ProjectLeader'), member(7)];
  const request = { members: added.map(({ userId, roleId }) => ({ userId, roleId })) };
  const membersUrl = `${environment.apiUrl}/project/${project.id}/members`;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectRepository, useClass: ProjectHttpRepository },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    store = TestBed.inject(ProjectStore);
    http = TestBed.inject(HttpTestingController);
    store.setMockProject(project, [], existing);
  });

  afterEach(() => {
    store.clear();
    http.verify();
  });

  it('reloads all seven members and the former leader role after a partial POST response', () => {
    const onSuccess = vi.fn();
    store.addMembers(project.id, request, onSuccess);
    expect(store.isAddingMember()).toBe(true);
    const post = http.expectOne(membersUrl);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(request);
    post.flush({ data: added });

    expect(store.members()).toEqual(existing);
    expect(store.currentProject()?.membersCount).toBe(5);
    const refreshed = [member(1), ...existing.slice(1), ...added];
    const get = http.expectOne(membersUrl);
    expect(get.request.method).toBe('GET');
    get.flush({ data: refreshed });

    expect(store.members()).toEqual(refreshed);
    expect(store.currentProject()?.membersCount).toBe(7);
    expect(store.members()[0].roleName).toBe('ProjectMember');
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(added);
    expect(store.isAddingMember()).toBe(false);
  });

  it('keeps all members when POST returns an empty list for existing users', () => {
    store.addMembers(project.id, { members: [{ userId: existing[0].userId }] });
    http.expectOne(membersUrl).flush({ data: [] });
    http.expectOne(membersUrl).flush({ data: existing });

    expect(store.members()).toEqual(existing);
    expect(store.currentProject()?.membersCount).toBe(5);
  });

  it('preserves state and does not signal success when POST fails', () => {
    const onSuccess = vi.fn();
    store.addMembers(project.id, request, onSuccess);
    http
      .expectOne(membersUrl)
      .flush(
        { message: 'Bạn không có quyền thêm thành viên.' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(store.members()).toEqual(existing);
    expect(store.currentProject()?.membersCount).toBe(5);
    expect(store.isAddingMember()).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(notifications.success).not.toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
      'Bạn không có quyền thêm thành viên.',
    );
    http.expectNone(membersUrl);
  });

  it('reports a failed refresh separately and preserves the last known member list', () => {
    const onSuccess = vi.fn();
    store.addMembers(project.id, request, onSuccess);
    http.expectOne(membersUrl).flush({ data: added });
    http.expectOne(membersUrl).flush(null, { status: 500, statusText: 'Server Error' });

    expect(store.members()).toEqual(existing);
    expect(store.currentProject()?.membersCount).toBe(5);
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(added);
    expect(notifications.success).toHaveBeenCalledTimes(1);
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
      'Không thể tải danh sách thành viên',
    );
  });

  it('does not insert mock members when the initial member read fails', () => {
    store.clear();
    store.loadMembers(project.id);
    http.expectOne(membersUrl).flush(null, { status: 500, statusText: 'Server Error' });
    expect(store.members()).toEqual([]);
    expect(notifications.error).toHaveBeenCalledTimes(1);
  });

  it('cancels an older member read before reloading after the addition', () => {
    store.loadMembers(project.id);
    const olderRead = http.expectOne(membersUrl);
    store.addMembers(project.id, request);
    http.expectOne(membersUrl).flush({ data: added });

    expect(olderRead.cancelled).toBe(true);
    http.expectOne(membersUrl).flush({ data: [...existing, ...added] });
    expect(store.currentProject()?.membersCount).toBe(7);
  });

  it('prevents duplicate submissions while POST is pending', () => {
    store.addMembers(project.id, request);
    store.addMembers(project.id, request);
    const posts = http.match(membersUrl);
    expect(posts).toHaveLength(1);
    posts[0].flush({ data: added });
    http.expectOne(membersUrl).flush({ data: [...existing, ...added] });
  });

  it('cancels the refresh when leaving the project', () => {
    store.addMembers(project.id, request);
    http.expectOne(membersUrl).flush({ data: added });
    const refresh = http.expectOne(membersUrl);
    store.clear();

    expect(refresh.cancelled).toBe(true);
    expect(store.members()).toEqual([]);
    expect(store.currentProject()).toBeNull();
  });
});
