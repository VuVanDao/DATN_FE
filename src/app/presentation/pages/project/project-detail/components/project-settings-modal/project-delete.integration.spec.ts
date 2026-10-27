import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../../../../environments/environment';
import { LayoutService } from '../../../../../../application/layout/layout.service';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../../../application/state/workspace.store';
import { Project } from '../../../../../../domain/models/project.model';
import { ProjectRepository } from '../../../../../../domain/repositories/project.repository';
import { ProjectHttpRepository } from '../../../../../../infrastructure/repositories/project-http.repository';
import { ProjectDetailPage } from '../../project-detail.page';
import { ProjectSettingsModalComponent } from './project-settings-modal.component';

describe('Delete project integration', () => {
  let fixture: ComponentFixture<ProjectSettingsModalComponent>;
  let store: ProjectStore;
  let http: HttpTestingController;
  const notifications = { success: vi.fn(), error: vi.fn() };
  const workspace = { currentWorkspace: () => null, onProjectDeleted: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const project: Project = {
    id: '11111111-1111-1111-1111-111111111111',
    workspaceId: '22222222-2222-2222-2222-222222222222',
    name: 'Project to delete',
    projectKey: 'APP',
    createdById: '33333333-3333-3333-3333-333333333333',
    createdByName: 'Creator',
    boardsCount: 1,
    membersCount: 1,
    sprintCount: 0,
    cardCount: 4,
    createdAt: '2026-10-27T01:00:00Z',
  };
  const deleteUrl = `${environment.apiUrl}/project/${project.id}`;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ProjectSettingsModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectRepository, useClass: ProjectHttpRepository },
        { provide: WorkspaceStore, useValue: workspace },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
        { provide: LayoutService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ workspaceSlug: 'team' }) } },
        },
      ],
    });
    store = TestBed.inject(ProjectStore);
    http = TestBed.inject(HttpTestingController);
    store.setMockProject(project, [
      {
        id: 'board',
        projectId: project.id,
        title: 'Board',
        slug: 'board',
        type: 'Kanban',
        createdAt: project.createdAt,
      },
    ]);
    fixture = TestBed.createComponent(ProjectSettingsModalComponent);
    fixture.componentRef.setInput('project', project);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    store.clear();
    http.verify();
  });

  function confirm(): void {
    fixture.componentInstance.startDelete();
    fixture.componentInstance.deleteName.setValue(project.name);
    fixture.componentInstance.confirmDelete();
  }

  it('requires explicit confirmation with the matching project name', () => {
    const component = fixture.componentInstance;
    component.deleteName.setValue(project.name);
    component.confirmDelete();
    component.startDelete();
    component.deleteName.setValue('Wrong name');
    component.confirmDelete();
    http.expectNone(deleteUrl);
    component.cancelDelete();
    expect(component.confirmingDelete()).toBe(false);
    expect(component.deleteName.value).toBe('');
  });

  it('sends one DELETE, blocks closing while pending, clears state and returns to the workspace', () => {
    const page = TestBed.runInInjectionContext(() => new ProjectDetailPage());
    fixture.componentInstance.deleted.subscribe((deleted) => page.onProjectDeleted(deleted));
    const closed = vi.spyOn(fixture.componentInstance.closed, 'emit');
    store.loadMembers(project.id);
    const pendingMembers = http.expectOne(`${deleteUrl}/members`);
    confirm();
    fixture.componentInstance.confirmDelete();
    fixture.componentInstance.close();
    fixture.componentInstance.cancelDelete();
    expect(closed).not.toHaveBeenCalled();
    expect(store.isDeleting()).toBe(true);
    expect(fixture.componentInstance.confirmingDelete()).toBe(true);
    const request = http.expectOne(deleteUrl);
    expect(request.request.method).toBe('DELETE');
    request.flush({ success: true, data: true });
    expect(pendingMembers.cancelled).toBe(true);
    expect(store.currentProject()).toBeNull();
    expect(store.boards()).toEqual([]);
    expect(store.members()).toEqual([]);
    expect(store.isDeleting()).toBe(false);
    expect(workspace.onProjectDeleted).toHaveBeenCalledExactlyOnceWith(project.workspaceId);
    expect(router.navigate).toHaveBeenCalledExactlyOnceWith(['/workspaces', 'team']);
    expect(notifications.success).toHaveBeenCalledTimes(1);
  });

  for (const status of [0, 403, 404, 500]) {
    it(`preserves project and confirmation on HTTP ${status}, with retry`, () => {
      const deleted = vi.spyOn(fixture.componentInstance.deleted, 'emit');
      confirm();
      http
        .expectOne(deleteUrl)
        .flush({ message: 'Không thể xóa dự án.' }, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
        'Không thể xóa dự án.',
      );
      expect(store.currentProject()).toEqual(project);
      expect(store.boards()).toHaveLength(1);
      expect(store.isDeleting()).toBe(false);
      expect(fixture.componentInstance.deleteName.value).toBe(project.name);
      expect(deleted).not.toHaveBeenCalled();
      expect(notifications.success).not.toHaveBeenCalled();
      expect(notifications.error).toHaveBeenCalledExactlyOnceWith('Không thể xóa dự án.');
      expect(router.navigate).not.toHaveBeenCalled();
      fixture.componentInstance.confirmDelete();
      http.expectOne(deleteUrl).flush({ data: true });
      expect(deleted).toHaveBeenCalledExactlyOnceWith(project);
    });
  }

  it('does not clear state or emit deletion when the API returns false', () => {
    const deleted = vi.spyOn(fixture.componentInstance.deleted, 'emit');
    confirm();
    http.expectOne(deleteUrl).flush({ data: false });
    expect(store.currentProject()).toEqual(project);
    expect(deleted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.deleteError()).toBeTruthy();
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it('cancels a pending deletion on navigation without firing success', () => {
    const deleted = vi.spyOn(fixture.componentInstance.deleted, 'emit');
    confirm();
    const request = http.expectOne(deleteUrl);
    store.clear();
    expect(request.cancelled).toBe(true);
    expect(store.isDeleting()).toBe(false);
    expect(deleted).not.toHaveBeenCalled();
  });
});
