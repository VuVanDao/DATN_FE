import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Board, Project } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { ProjectHttpRepository } from '../../infrastructure/repositories/project-http.repository';
import { NotificationService } from '../shared/notification.service';
import { ProjectStore } from './project.store';

describe('Project mutation feedback', () => {
  let store: ProjectStore;
  let http: HttpTestingController;
  const notifications = { success: vi.fn(), error: vi.fn() };
  const project: Project = {
    id: '11111111-1111-1111-1111-111111111111',
    workspaceId: '22222222-2222-2222-2222-222222222222',
    name: 'Original project',
    projectKey: 'APP',
    description: 'Original description',
    createdById: '33333333-3333-3333-3333-333333333333',
    createdByName: 'Creator',
    boardsCount: 1,
    membersCount: 2,
    sprintCount: 3,
    cardCount: 12,
    createdAt: '2026-10-27T01:00:00Z',
  };
  const board: Board = {
    id: '44444444-4444-4444-4444-444444444444',
    projectId: project.id,
    title: 'Existing board',
    slug: 'existing-board',
    type: 'Kanban',
    createdAt: project.createdAt,
  };
  const update = { name: 'Updated project', projectKey: 'NEW', description: null };
  const create = { projectId: project.id, title: 'New board', slug: 'new-board', type: 'Kanban' };

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
    store.setMockProject(project, [board]);
  });

  afterEach(() => {
    store.clear();
    http.verify();
  });

  for (const status of [0, 400, 403, 500]) {
    it(`preserves project state and reports only an error when update fails with ${status}`, () => {
      const onSuccess = vi.fn();
      store.updateProject(project.id, update, onSuccess);
      expect(store.isSaving()).toBe(true);
      const request = http.expectOne(`${environment.apiUrl}/project/${project.id}`);
      expect(request.request.method).toBe('PUT');
      request.flush({ message: 'Cập nhật bị từ chối.' }, { status, statusText: 'Error' });

      expect(store.currentProject()).toEqual(project);
      expect(store.boards()).toEqual([board]);
      expect(store.isSaving()).toBe(false);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(notifications.success).not.toHaveBeenCalled();
      expect(notifications.error).toHaveBeenCalledExactlyOnceWith('Cập nhật bị từ chối.');
    });

    it(`does not create a fake board or increment counts when creation fails with ${status}`, () => {
      const onSuccess = vi.fn();
      store.createBoard(create, onSuccess);
      expect(store.isCreatingBoard()).toBe(true);
      const request = http.expectOne(`${environment.apiUrl}/board`);
      expect(request.request.method).toBe('POST');
      request.flush({ message: 'Tạo bảng bị từ chối.' }, { status, statusText: 'Error' });

      expect(store.boards()).toEqual([board]);
      expect(store.currentProject()).toEqual(project);
      expect(store.isCreatingBoard()).toBe(false);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(notifications.success).not.toHaveBeenCalled();
      expect(notifications.error).toHaveBeenCalledExactlyOnceWith('Tạo bảng bị từ chối.');
    });
  }

  it('updates from the real response including cardCount on success', () => {
    const onSuccess = vi.fn();
    store.updateProject(project.id, update, onSuccess);
    const updated = { ...project, ...update, cardCount: 14 };
    http.expectOne(`${environment.apiUrl}/project/${project.id}`).flush({ data: updated });

    expect(store.currentProject()).toEqual(updated);
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(updated);
    expect(notifications.success).toHaveBeenCalledTimes(1);
    expect(notifications.error).not.toHaveBeenCalled();
    expect(store.isSaving()).toBe(false);
  });

  it('adds the real board and increments its count on success', () => {
    const onSuccess = vi.fn();
    store.createBoard(create, onSuccess);
    const created = { ...board, ...create, id: '55555555-5555-5555-5555-555555555555' };
    http.expectOne(`${environment.apiUrl}/board`).flush({ data: created });

    expect(store.boards()).toEqual([created, board]);
    expect(store.currentProject()?.boardsCount).toBe(2);
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(created);
    expect(notifications.success).toHaveBeenCalledTimes(1);
    expect(notifications.error).not.toHaveBeenCalled();
    expect(store.isCreatingBoard()).toBe(false);
  });
});
