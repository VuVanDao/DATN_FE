import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../../../../../application/state/auth.store';
import { BoardStore } from '../../../../../application/state/board.store';
import { WorkspaceStore } from '../../../../../application/state/workspace.store';
import { LayoutService } from '../../../layout.service';
import { MainSidebarComponent } from './main-sidebar.component';

describe('MainSidebarComponent', () => {
  let component: MainSidebarComponent;
  let fixture: ComponentFixture<MainSidebarComponent>;

  const mockBoardStore = {
    myBoards: signal({ recentBoards: [], pinnedBoards: [], allBoards: [] }),
    isLoadingMyBoards: signal(false),
    loadMyBoards: vi.fn(),
  };

  const mockWorkspaceStore = {
    workspaces: signal([]),
    displayedWorkspaces: signal([]),
    isLoading: signal(false),
    totalCount: signal(0),
    loadWorkspaces: vi.fn(),
  };

  const mockAuthStore = {
    isAuthenticated: signal(true),
  };

  const mockLayoutService = {
    isSidebarCollapsed: signal(false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: BoardStore, useValue: mockBoardStore },
        { provide: WorkspaceStore, useValue: mockWorkspaceStore },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: LayoutService, useValue: mockLayoutService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load workspaces if authenticated', () => {
    expect(component).toBeTruthy();
    expect(mockWorkspaceStore.loadWorkspaces).toHaveBeenCalled();
  });

  it('should toggle create modal state', () => {
    expect(component.isCreateModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    component.closeCreateModal();
    expect(component.isCreateModalOpen()).toBe(false);
  });
});
