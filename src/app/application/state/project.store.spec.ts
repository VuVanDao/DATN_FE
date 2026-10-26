import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Project } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { NotificationService } from '../shared/notification.service';
import { ProjectStore } from './project.store';

describe('ProjectStore', () => {
  let store: ProjectStore;

  const mockProject: Project = {
    id: 'proj-1',
    name: 'App di động Fintech',
    projectKey: 'FIN',
    description: 'Ngân hàng số',
    workspaceId: 'ws-1',
    workspaceName: 'Acme Corp',
    createdById: 'user-1',
    createdByName: 'Minh Nguyễn',
    boardsCount: 2,
    membersCount: 5,
    sprintCount: 3,
    cardCount: 20,
    createdAt: '2026-09-03T10:00:00Z',
  };

  const fakeProjectRepo: Partial<ProjectRepository> = {
    getProjectDetail: () => of(mockProject),
    getProjectBoards: () =>
      of([
        {
          id: 'b-1',
          projectId: 'proj-1',
          title: 'Bảng phát triển',
          slug: 'bang-phat-trien',
          type: 'Kanban',
          createdAt: '2026-09-04T10:00:00Z',
        },
      ]),
    getProjectMembers: () => of([]),
    getProjectRoles: () => of([]),
    updateProject: (_, req) => of({ ...mockProject, ...req }),
    createBoard: (req) =>
      of({
        id: 'b-new',
        projectId: req.projectId,
        title: req.title,
        slug: req.slug,
        type: String(req.type),
        createdAt: new Date().toISOString(),
      }),
  };

  const fakeNotificationService: Partial<NotificationService> = {
    success: () => {},
    error: () => {},
    warning: () => {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectStore,
        { provide: ProjectRepository, useValue: fakeProjectRepo },
        { provide: NotificationService, useValue: fakeNotificationService },
      ],
    });
    store = TestBed.inject(ProjectStore);
  });

  it('should load project detail successfully', () => {
    store.getProjectDetail('FIN', 'ws-1');
    expect(store.currentProject()?.name).toBe('App di động Fintech');
    expect(store.currentProject()?.projectKey).toBe('FIN');
  });

  it('should create board and increment boardsCount', () => {
    store.setMockProject(mockProject);
    store.createBoard({
      projectId: 'proj-1',
      title: 'Sprint Planning',
      slug: 'sprint-planning',
      type: 'Scrum',
    });
    expect(store.boards().length).toBeGreaterThan(0);
    expect(store.currentProject()?.boardsCount).toBe(3);
  });
});
