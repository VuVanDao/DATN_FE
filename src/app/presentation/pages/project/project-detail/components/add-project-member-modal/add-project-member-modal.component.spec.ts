import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../../../../environments/environment';
import { NotificationService } from '../../../../../../application/shared/notification.service';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { WorkspaceMember } from '../../../../../../domain/models/workspace.model';
import { ProjectRepository } from '../../../../../../domain/repositories/project.repository';
import { WorkspaceRepository } from '../../../../../../domain/repositories/workspace.repository';
import { ProjectHttpRepository } from '../../../../../../infrastructure/repositories/project-http.repository';
import { WorkspaceHttpRepository } from '../../../../../../infrastructure/repositories/workspace-http.repository';
import { AddProjectMemberModalComponent } from './add-project-member-modal.component';

describe('Add project member modal API integration', () => {
  let fixture: ComponentFixture<AddProjectMemberModalComponent>;
  let http: HttpTestingController;
  let store: ProjectStore;
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const projectId = '22222222-2222-2222-2222-222222222222';
  const userId = '33333333-3333-3333-3333-333333333333';
  const roleId = '44444444-4444-4444-4444-444444444444';
  const rolesUrl = `${environment.apiUrl}/project/roles`;
  const membersUrl = `${environment.apiUrl}/project/${projectId}/members`;
  const candidate: WorkspaceMember = {
    userId,
    username: 'Workspace member',
    email: 'member@example.com',
    roleId,
    roleName: 'Member',
    joinAt: '2026-10-27T01:00:00Z',
  };
  const pageUrl = (page = 1, id = workspaceId) =>
    `${environment.apiUrl}/workspaces/${id}/members?pageIndex=${page}&pageSize=20`;
  const page = (items: WorkspaceMember[], pageIndex = 1, hasNextPage = false) => ({
    data: {
      items,
      pageIndex,
      pageSize: 20,
      totalCount: hasNextPage ? 21 : items.length,
      totalPages: hasNextPage ? 2 : pageIndex,
      hasNextPage,
      hasPreviousPage: pageIndex > 1,
    },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddProjectMemberModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectRepository, useClass: ProjectHttpRepository },
        { provide: WorkspaceRepository, useClass: WorkspaceHttpRepository },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(AddProjectMemberModalComponent);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(ProjectStore);
    fixture.componentRef.setInput('workspaceId', workspaceId);
    fixture.componentRef.setInput('projectId', projectId);
  });

  afterEach(() => {
    fixture.destroy();
    store.clear();
    http.verify();
  });

  function open(): void {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  }

  function ready(): void {
    open();
    http.expectOne(pageUrl()).flush(page([candidate]));
    http.expectOne(rolesUrl).flush({ data: [{ id: roleId, name: 'ProjectLeader' }] });
    fixture.detectChanges();
  }

  it('loads candidates and roles only when opened, without a workspace cache', () => {
    fixture.detectChanges();
    http.expectNone(pageUrl());
    http.expectNone(rolesUrl);
    ready();
    expect(fixture.nativeElement.textContent).toContain(candidate.email);
    expect(store.roles()[0].id).toBe(roleId);
  });

  it('can select a member on a later page and sends their real ID and selected role', () => {
    open();
    http.expectOne(pageUrl()).flush(page([candidate], 1, true));
    http.expectOne(rolesUrl).flush({ data: [{ id: roleId, name: 'ProjectLeader' }] });
    const later = {
      ...candidate,
      userId: '55555555-5555-5555-5555-555555555555',
      email: 'later@example.com',
    };
    fixture.componentInstance.loadCandidates(true);
    http.expectOne(pageUrl(2)).flush(page([later], 2));
    fixture.componentInstance.form.setValue({ userId: later.userId, roleId });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Gán ProjectLeader');
    const closed = vi.spyOn(fixture.componentInstance.closed, 'emit');
    fixture.componentInstance.onSubmit();
    const post = http.expectOne(membersUrl);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ members: [{ userId: later.userId, roleId }] });
    post.flush({ data: [{ ...later, roleName: 'ProjectLeader' }] });
    http.expectOne(membersUrl).flush({ data: [{ ...later, roleName: 'ProjectLeader' }] });
    expect(store.members()[0].userId).toBe(later.userId);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('uses the default role and retains the form and modal when POST fails', () => {
    ready();
    fixture.componentInstance.form.setValue({ userId, roleId: '' });
    const closed = vi.spyOn(fixture.componentInstance.closed, 'emit');
    fixture.componentInstance.onSubmit();
    const post = http.expectOne(membersUrl);
    expect(post.request.body).toEqual({ members: [{ userId, roleId: null }] });
    post.flush(
      { message: 'Không có quyền thêm thành viên.' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Không có quyền thêm thành viên.');
    expect(fixture.componentInstance.form.controls.userId.value).toBe(userId);
    expect(closed).not.toHaveBeenCalled();
  });

  it('rejects fabricated IDs and members already in the project', () => {
    ready();
    fixture.componentInstance.form.setValue({ userId: 'unknown', roleId: '' });
    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.submitError()).toContain('chọn một thành viên');
    store.loadMembers(projectId);
    http.expectOne(membersUrl).flush({ data: [{ ...candidate, joinedAt: candidate.joinAt }] });
    fixture.componentInstance.form.controls.userId.setValue(userId);
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.componentInstance.submitError()).toContain('đã có trong dự án');
    expect(fixture.nativeElement.querySelector(`option[value="${userId}"]`).disabled).toBe(true);
    http.expectNone(membersUrl);
  });

  it('shows real role errors and supports retry without fake role IDs', () => {
    open();
    http.expectOne(pageUrl()).flush(page([candidate]));
    http
      .expectOne(rolesUrl)
      .flush({ message: 'Không tải được vai trò.' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(store.roles()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Không tải được vai trò.');
    fixture.componentInstance.form.controls.userId.setValue(userId);
    fixture.componentInstance.onSubmit();
    http.expectNone(membersUrl);
    store.loadRoles();
    http.expectOne(rolesUrl).flush({ data: [{ id: roleId, name: 'ProjectMember' }] });
    expect(store.rolesError()).toBeNull();
  });

  it('retries a failed candidate page and cancels reads on workspace change or destruction', () => {
    open();
    http.expectOne(rolesUrl).flush({ data: [] });
    http.expectOne(pageUrl()).flush(null, { status: 500, statusText: 'Error' });
    expect(fixture.componentInstance.candidates.error()).toBeTruthy();
    fixture.componentInstance.loadCandidates();
    const oldRead = http.expectOne(pageUrl());
    fixture.componentRef.setInput('workspaceId', 'another-workspace');
    fixture.detectChanges();
    expect(oldRead.cancelled).toBe(true);
    http.expectOne(rolesUrl).flush({ data: [] });
    const currentRead = http.expectOne(pageUrl(1, 'another-workspace'));
    fixture.destroy();
    expect(currentRead.cancelled).toBe(true);
  });
});
