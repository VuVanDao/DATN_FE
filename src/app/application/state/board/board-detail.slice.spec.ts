import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardDetail } from '../../../domain/models/board-detail.model';
import { Board, UpdateBoardRequest } from '../../../domain/models/project.model';
import { DeleteBoardUseCase } from '../../board/delete-board.use-case';
import { GetBoardDetailUseCase } from '../../board/get-board-detail.use-case';
import { UpdateBoardUseCase } from '../../board/update-board.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';
import { BoardDetailSlice } from './board-detail.slice';

describe('BoardDetailSlice', () => {
  let slice: BoardDetailSlice;
  let mockGetBoardDetailUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateBoardUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDeleteBoardUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockNotificationService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  const sampleBoardDetail: BoardDetail = {
    id: 'b-1',
    title: 'Test Board',
    slug: 'test-board',
    type: 'Kanban',
    projectId: 'p-1',
    projectName: 'Test Project',
    isPinned: false,
    columns: [],
  };

  beforeEach(() => {
    mockGetBoardDetailUseCase = { execute: vi.fn() };
    mockUpdateBoardUseCase = { execute: vi.fn() };
    mockDeleteBoardUseCase = { execute: vi.fn() };
    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        BoardDetailSlice,
        StoreRequestRunner,
        { provide: GetBoardDetailUseCase, useValue: mockGetBoardDetailUseCase },
        { provide: UpdateBoardUseCase, useValue: mockUpdateBoardUseCase },
        { provide: DeleteBoardUseCase, useValue: mockDeleteBoardUseCase },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    slice = TestBed.inject(BoardDetailSlice);
  });

  it('should initialize with default states', () => {
    expect(slice.currentBoard()).toBeNull();
    expect(slice.isLoading()).toBe(false);
    expect(slice.error()).toBeNull();
    expect(slice.isUpdatingBoard()).toBe(false);
    expect(slice.isDeletingBoard()).toBe(false);
  });

  describe('loadBoard', () => {
    it('should set board and call onSuccess on success', () => {
      mockGetBoardDetailUseCase.execute.mockReturnValue(of(sampleBoardDetail));
      const onSuccessSpy = vi.fn();

      slice.loadBoard('test-board', 'p-1', onSuccessSpy);

      expect(mockGetBoardDetailUseCase.execute).toHaveBeenCalledWith('test-board', 'p-1');
      expect(slice.currentBoard()).toEqual(sampleBoardDetail);
      expect(slice.isLoading()).toBe(false);
      expect(slice.error()).toBeNull();
      expect(onSuccessSpy).toHaveBeenCalledWith(sampleBoardDetail);
    });

    it('should set errorSignal and call onError on failure', () => {
      mockGetBoardDetailUseCase.execute.mockReturnValue(
        throwError(() => new Error('Server error')),
      );
      const onErrorSpy = vi.fn();

      slice.loadBoard('test-board', 'p-1', undefined, onErrorSpy);

      expect(slice.currentBoard()).toBeNull();
      expect(slice.isLoading()).toBe(false);
      expect(slice.error()).toBe('Không thể tải thông tin bảng.');
      expect(onErrorSpy).toHaveBeenCalledWith('Không thể tải thông tin bảng.');
    });
  });

  describe('silentReloadBoard', () => {
    it('should silently refresh board on success', () => {
      const updated = { ...sampleBoardDetail, title: 'Updated Board' };
      mockGetBoardDetailUseCase.execute.mockReturnValue(of(updated));
      const onSuccessSpy = vi.fn();

      slice.silentReloadBoard('test-board', 'p-1', onSuccessSpy);

      expect(mockGetBoardDetailUseCase.execute).toHaveBeenCalledWith('test-board', 'p-1');
      expect(slice.currentBoard()).toEqual(updated);
      expect(onSuccessSpy).toHaveBeenCalledWith(updated);
    });
  });

  describe('updateBoard', () => {
    it('should update board state, show toast and trigger callback on success', () => {
      slice.setBoard(sampleBoardDetail);
      const updatePayload: UpdateBoardRequest = {
        title: 'New Title',
        slug: 'new-title',
        type: 'Kanban',
      };
      const updatedResult: Board = {
        id: 'b-1',
        projectId: 'p-1',
        title: 'New Title',
        slug: 'new-title',
        type: 'Kanban',
        createdAt: new Date().toISOString(),
      };
      mockUpdateBoardUseCase.execute.mockReturnValue(of(updatedResult));
      const onSuccessSpy = vi.fn();

      slice.updateBoard('b-1', updatePayload, onSuccessSpy);

      expect(mockUpdateBoardUseCase.execute).toHaveBeenCalledWith('b-1', updatePayload);
      expect(slice.currentBoard()?.title).toBe('New Title');
      expect(slice.currentBoard()?.slug).toBe('new-title');
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Đã cập nhật thông tin bảng thành công!',
      );
      expect(onSuccessSpy).toHaveBeenCalledWith(updatedResult);
    });
  });

  describe('deleteBoard', () => {
    it('should call delete usecase, notify and trigger callback on success', () => {
      mockDeleteBoardUseCase.execute.mockReturnValue(of(true));
      const onSuccessSpy = vi.fn();

      slice.deleteBoard('b-1', onSuccessSpy);

      expect(mockDeleteBoardUseCase.execute).toHaveBeenCalledWith('b-1');
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Đã xoá bảng và toàn bộ dữ liệu trực thuộc thành công.',
      );
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  describe('local state helpers', () => {
    it('should set pin locally', () => {
      slice.setBoard(sampleBoardDetail);
      expect(slice.currentBoard()?.isPinned).toBe(false);

      slice.setBoardPinnedLocally(true);
      expect(slice.currentBoard()?.isPinned).toBe(true);
    });

    it('should update board locally with custom updater', () => {
      slice.setBoard(sampleBoardDetail);
      slice.updateBoardLocally((b) => (b ? { ...b, title: 'Locally Updated' } : null));

      expect(slice.currentBoard()?.title).toBe('Locally Updated');
    });

    it('should clear board and error state', () => {
      slice.setBoard(sampleBoardDetail);
      expect(slice.currentBoard()).not.toBeNull();

      slice.clear();
      expect(slice.currentBoard()).toBeNull();
      expect(slice.error()).toBeNull();
    });
  });
});
