import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardStore } from '../../../../../application/state/board.store';
import { MainSidebarRecentComponent } from './main-sidebar-recent.component';

describe('MainSidebarRecentComponent', () => {
  let component: MainSidebarRecentComponent;
  let fixture: ComponentFixture<MainSidebarRecentComponent>;

  const mockBoardStore = {
    myBoards: signal({
      recentBoards: [
        {
          boardId: 'b-1',
          title: 'Test Board 1',
          boardSlug: 'test-board-1',
          projectId: 'p-1',
          projectName: 'Project 1',
          workspaceId: 'w-1',
          isPinned: false,
          lastViewedAt: '2026-01-01T00:00:00Z',
        },
      ],
      pinnedBoards: [
        {
          boardId: 'b-2',
          title: 'Pinned Board',
          boardSlug: 'pinned-board',
          projectId: 'p-1',
          projectName: 'Project 1',
          workspaceId: 'w-1',
          isPinned: true,
          lastViewedAt: '2026-01-01T00:00:00Z',
        },
      ],
      allBoards: [],
    }),
    isLoadingMyBoards: signal(false),
    loadMyBoards: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MainSidebarRecentComponent],
      providers: [
        provideRouter([]),
        { provide: BoardStore, useValue: mockBoardStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainSidebarRecentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load my boards on init', () => {
    expect(component).toBeTruthy();
    expect(mockBoardStore.loadMyBoards).toHaveBeenCalled();
  });

  it('should toggle recent dropdown', () => {
    expect(component.isRecentOpen()).toBe(false);
    component.toggleRecent();
    expect(component.isRecentOpen()).toBe(true);
    expect(mockBoardStore.loadMyBoards).toHaveBeenCalledTimes(2);
  });

  it('should toggle recent boards section', () => {
    expect(component.isRecentBoardsOpen()).toBe(true);
    component.toggleRecentBoards();
    expect(component.isRecentBoardsOpen()).toBe(false);
  });

  it('should generate consistent color for boardId', () => {
    const color1 = component.getBoardColor('board-123');
    const color2 = component.getBoardColor('board-123');
    expect(color1).toBe(color2);
    expect(color1.startsWith('bg-')).toBe(true);
  });
});
