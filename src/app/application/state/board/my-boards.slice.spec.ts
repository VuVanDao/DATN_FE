import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyBoardItem, MyBoards } from '../../../domain/models/project.model';
import { GetMyBoardsUseCase } from '../../board/get-my-boards.use-case';
import { UpdateBoardPreferenceUseCase } from '../../board/update-board-preference.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';
import { MyBoardsSlice } from './my-boards.slice';

describe('MyBoardsSlice', () => {
  let slice: MyBoardsSlice;
  let mockGetMyBoardsUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateBoardPreferenceUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockNotificationService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  const sampleRecentBoard: MyBoardItem = {
    boardId: 'b-1',
    title: 'Board 1',
    boardSlug: 'board-1',
    projectId: 'p-1',
    projectName: 'Project 1',
    isPinned: false,
    lastViewedAt: new Date().toISOString(),
  };

  const samplePinnedBoard: MyBoardItem = {
    boardId: 'b-2',
    title: 'Board 2',
    boardSlug: 'board-2',
    projectId: 'p-1',
    projectName: 'Project 1',
    isPinned: true,
    lastViewedAt: new Date().toISOString(),
  };

  const sampleMyBoards: MyBoards = {
    recentBoards: [sampleRecentBoard],
    pinnedBoards: [samplePinnedBoard],
  };

  beforeEach(() => {
    mockGetMyBoardsUseCase = {
      execute: vi.fn(),
    };
    mockUpdateBoardPreferenceUseCase = {
      execute: vi.fn(),
    };
    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MyBoardsSlice,
        StoreRequestRunner,
        { provide: GetMyBoardsUseCase, useValue: mockGetMyBoardsUseCase },
        { provide: UpdateBoardPreferenceUseCase, useValue: mockUpdateBoardPreferenceUseCase },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    slice = TestBed.inject(MyBoardsSlice);
  });

  it('should initialize with empty boards and not loading', () => {
    expect(slice.myBoards()).toEqual({ recentBoards: [], pinnedBoards: [] });
    expect(slice.isLoadingMyBoards()).toBe(false);
  });

  describe('loadMyBoards', () => {
    it('should fetch boards and update state on success', () => {
      mockGetMyBoardsUseCase.execute.mockReturnValue(of(sampleMyBoards));

      slice.loadMyBoards(5);

      expect(mockGetMyBoardsUseCase.execute).toHaveBeenCalledWith(5);
      expect(slice.myBoards()).toEqual(sampleMyBoards);
      expect(slice.isLoadingMyBoards()).toBe(false);
    });

    it('should set fallback empty boards if null returned', () => {
      mockGetMyBoardsUseCase.execute.mockReturnValue(of(null as unknown as MyBoards));

      slice.loadMyBoards();

      expect(slice.myBoards()).toEqual({ recentBoards: [], pinnedBoards: [] });
      expect(slice.isLoadingMyBoards()).toBe(false);
    });
  });

  describe('updatePinLocally', () => {
    beforeEach(() => {
      mockGetMyBoardsUseCase.execute.mockReturnValue(of(sampleMyBoards));
      slice.loadMyBoards();
    });

    it('should pin a recent board and add it to pinned list', () => {
      slice.updatePinLocally('b-1', true);

      const state = slice.myBoards();
      const updatedRecent = state.recentBoards.find((b) => b.boardId === 'b-1');
      expect(updatedRecent?.isPinned).toBe(true);

      const inPinned = state.pinnedBoards.find((b) => b.boardId === 'b-1');
      expect(inPinned).toBeDefined();
      expect(inPinned?.isPinned).toBe(true);
    });

    it('should unpin a pinned board and remove it from pinned list', () => {
      slice.updatePinLocally('b-2', false);

      const state = slice.myBoards();
      const inPinned = state.pinnedBoards.find((b) => b.boardId === 'b-2');
      expect(inPinned).toBeUndefined();
    });
  });

  describe('toggleBoardPin', () => {
    beforeEach(() => {
      mockGetMyBoardsUseCase.execute.mockReturnValue(of(sampleMyBoards));
      slice.loadMyBoards();
    });

    it('should optimistically update, call usecase, show toast and trigger callbacks on success', () => {
      const onSuccessSpy = vi.fn();
      mockUpdateBoardPreferenceUseCase.execute.mockReturnValue(
        of({ boardId: 'b-1', isPinned: true, lastViewedAt: new Date().toISOString() }),
      );

      slice.toggleBoardPin('b-1', false, onSuccessSpy);

      expect(mockUpdateBoardPreferenceUseCase.execute).toHaveBeenCalledWith('b-1', { isPinned: true });
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã ghim bảng vào danh sách ưu tiên');
      expect(onSuccessSpy).toHaveBeenCalledWith(true);
    });

    it('should revert pin on error, show error notification and trigger error callback', () => {
      const onErrorSpy = vi.fn();
      mockUpdateBoardPreferenceUseCase.execute.mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      slice.toggleBoardPin('b-1', false, undefined, onErrorSpy);

      expect(mockNotificationService.error).toHaveBeenCalledWith('Không thể cập nhật tùy chọn ghim bảng.');
      expect(onErrorSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('clear', () => {
    it('should reset boards to empty', () => {
      mockGetMyBoardsUseCase.execute.mockReturnValue(of(sampleMyBoards));
      slice.loadMyBoards();
      expect(slice.myBoards().recentBoards.length).toBe(1);

      slice.clear();

      expect(slice.myBoards()).toEqual({ recentBoards: [], pinnedBoards: [] });
    });
  });
});
