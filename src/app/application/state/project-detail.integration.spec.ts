import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { Project } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { ProjectHttpRepository } from '../../infrastructure/repositories/project-http.repository';
import { NotificationService } from '../shared/notification.service';
import { ProjectStore } from './project.store';

describe('Project detail API integration', () => {
  let store: ProjectStore;
  let http: HttpTestingController;
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const project: Project = {
    id: '22222222-2222-2222-2222-222222222222',
    workspaceId,
    name: 'Project from API',
    projectKey: 'APP',
    description: null,
    createdById: '33333333-3333-3333-3333-333333333333',
    createdByName: 'Project creator',
    boardsCount: 1,
    membersCount: 2,
    sprintCount: 3,
    cardCount: 4,
    createdAt: '2026-10-27T01:00:00Z',
  };
  const detailUrl = (key: string) =>
    `${environment.apiUrl}/project/${key}/workspace/${workspaceId}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectRepository, useClass: ProjectHttpRepository },
        { provide: NotificationService, useValue: { success() {}, error() {} } },
      ],
    });
    store = TestBed.inject(ProjectStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    store.clear();
    http.verify();
  });

  it('loads the scoped endpoint and exposes the real response and counts', () => {
    store.getProjectDetail('APP', workspaceId);
    expect(store.isLoading()).toBe(true);
    expect(store.currentProject()).toBeNull();

    const request = http.expectOne(detailUrl('APP'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: project });

    expect(store.currentProject()).toEqual(project);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    http.expectOne(`${environment.apiUrl}/board/project/${project.id}`).flush({ data: [] });
    http.expectOne(`${environment.apiUrl}/project/${project.id}/members`).flush({ data: [] });
  });

  for (const status of [403, 404, 500]) {
    it(`shows HTTP ${status} errors without substituting a mock project and allows retry`, () => {
      store.getProjectDetail('APP', workspaceId);
      http
        .expectOne(detailUrl('APP'))
        .flush({ message: 'Không thể xem dự án này.' }, { status, statusText: 'Error' });

      expect(store.currentProject()).toBeNull();
      expect(store.boards()).toEqual([]);
      expect(store.members()).toEqual([]);
      expect(store.error()).toBe('Không thể xem dự án này.');
      expect(store.isLoading()).toBe(false);

      store.getProjectDetail('APP', workspaceId);
      expect(store.error()).toBeNull();
      expect(store.isLoading()).toBe(true);
      http.expectOne(detailUrl('APP'));
      store.clear();
      expect(store.isLoading()).toBe(false);
    });
  }

  it('cancels an older detail request when another project starts loading', () => {
    store.getProjectDetail('APP', workspaceId);
    const older = http.expectOne(detailUrl('APP'));
    store.getProjectDetail('NEW', workspaceId);

    expect(older.cancelled).toBe(true);
    expect(store.isLoading()).toBe(true);
    const newer = http.expectOne(detailUrl('NEW'));
    newer.flush({ data: { ...project, projectKey: 'NEW' } });
    expect(store.currentProject()?.projectKey).toBe('NEW');
    http.expectOne(`${environment.apiUrl}/board/project/${project.id}`).flush({ data: [] });
    http.expectOne(`${environment.apiUrl}/project/${project.id}/members`).flush({ data: [] });
  });

  it('does not insert mock boards when the board read fails', () => {
    store.clear();
    store.loadBoards(project.id);
    http
      .expectOne(`${environment.apiUrl}/board/project/${project.id}`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    expect(store.boards()).toEqual([]);
  });

  it('clears the previous project and cancels its related reads on navigation', () => {
    store.getProjectDetail('APP', workspaceId);
    http.expectOne(detailUrl('APP')).flush({ data: project });
    const boards = http.expectOne(`${environment.apiUrl}/board/project/${project.id}`);
    const members = http.expectOne(`${environment.apiUrl}/project/${project.id}/members`);

    store.getProjectDetail('NEW', workspaceId);
    expect(boards.cancelled).toBe(true);
    expect(members.cancelled).toBe(true);
    expect(store.currentProject()).toBeNull();
    expect(store.boards()).toEqual([]);
    expect(store.members()).toEqual([]);
    http.expectOne(detailUrl('NEW'));
  });
});
