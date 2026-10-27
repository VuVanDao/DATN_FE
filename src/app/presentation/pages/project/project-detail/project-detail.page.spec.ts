import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayoutService } from '../../../../application/layout/layout.service';
import { ProjectStore } from '../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../application/state/workspace.store';
import { ProjectDetailPage } from './project-detail.page';

describe('ProjectDetailPage route and error states', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let store: {
    currentProject: ReturnType<typeof signal<null>>;
    boards: ReturnType<typeof signal<[]>>;
    members: ReturnType<typeof signal<[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getProjectDetail: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ projectKey: 'APP', workspaceId }));
    query = new BehaviorSubject(convertToParamMap({}));
    store = {
      currentProject: signal(null),
      boards: signal([]),
      members: signal([]),
      isLoading: signal(false),
      error: signal(null),
      getProjectDetail: vi.fn(),
      clear: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [
        provideRouter([]),
        { provide: ProjectStore, useValue: store },
        { provide: WorkspaceStore, useValue: { currentWorkspace: () => null } },
        { provide: LayoutService, useValue: { setSidebar() {} } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params,
            queryParamMap: query,
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    });
  });

  it('loads route identifiers and reloads when a reused route changes project', () => {
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.detectChanges();
    expect(store.getProjectDetail).toHaveBeenCalledWith('APP', workspaceId);

    params.next(convertToParamMap({ projectKey: 'NEW', workspaceId }));
    expect(store.getProjectDetail).toHaveBeenLastCalledWith('NEW', workspaceId);
    fixture.destroy();
    expect(store.clear).toHaveBeenCalled();
  });

  it('shows a route error without issuing a request when workspace context is missing', () => {
    params.next(convertToParamMap({ projectKey: 'APP' }));
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.detectChanges();

    expect(store.getProjectDetail).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Đường dẫn thiếu mã dự án hoặc thông tin workspace.',
    );
  });

  it('supports workspace query parameters and renders an API error with retry', () => {
    params.next(convertToParamMap({ projectKey: 'APP' }));
    query.next(convertToParamMap({ workspaceId }));
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.detectChanges();
    expect(store.getProjectDetail).toHaveBeenCalledWith('APP', workspaceId);

    store.error.set('Bạn không có quyền xem dự án.');
    fixture.detectChanges();
    const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('Bạn không có quyền xem dự án.');
    alert.querySelector('button')!.click();
    expect(store.getProjectDetail).toHaveBeenCalledTimes(2);

    query.next(convertToParamMap({ workspaceId: 'another-workspace' }));
    expect(store.getProjectDetail).toHaveBeenLastCalledWith('APP', 'another-workspace');
  });
});
