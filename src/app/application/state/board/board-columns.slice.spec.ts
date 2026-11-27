import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardDetail, ColumnSummary } from '../../../domain/models/board-detail.model';
import { CreateColumnUseCase } from '../../board/create-column.use-case';
import { DeleteColumnUseCase } from '../../board/delete-column.use-case';
import { ReorderColumnsUseCase } from '../../board/reorder-columns.use-case';
import { UpdateColumnUseCase } from '../../board/update-column.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';

describe('BoardColumnsSlice', () => {
  let slice: BoardColumnsSlice;
  let mockCreateColumnUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateColumnUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDeleteColumnUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockReorderColumnsUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockNotificationService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };
  let currentBoardSignal: ReturnType<typeof signal<BoardDetail | null>>;
  let mockBoardDetailSlice: {
    currentBoard: any;
    updateBoardLocally: ReturnType<typeof vi.fn>;
  };

  const sampleBoard: BoardDetail = {
    id: 'b-1',
    title: 'Test Board',
    slug: 'test-board',
    type: 'Kanban',
    projectId: 'p-1',
    projectName: 'Test Project',
    isPinned: false,
    columns: [],
  };

  const sampleColumn1: ColumnSummary = {
    id: 'col-1',
    title: 'To Do',
    position: 0,
    isDoneColumn: false,
    boardId: 'b-1',
    cards: [],
  };

  const sampleColumn2: ColumnSummary = {
    id: 'col-2',
    title: 'Done',
    position: 1,
    isDoneColumn: true,
    boardId: 'b-1',
    cards: [],
  };

  beforeEach(() => {
    mockCreateColumnUseCase = { execute: vi.fn() };
    mockUpdateColumnUseCase = { execute: vi.fn() };
    mockDeleteColumnUseCase = { execute: vi.fn() };
    mockReorderColumnsUseCase = { execute: vi.fn() };
    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    currentBoardSignal = signal<BoardDetail | null>({
      ...sampleBoard,
      columns: [sampleColumn1, sampleColumn2],
    });

    mockBoardDetailSlice = {
      currentBoard: currentBoardSignal.asReadonly(),
      updateBoardLocally: vi.fn((updater) => {
        currentBoardSignal.update(updater);
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        BoardColumnsSlice,
        StoreRequestRunner,
        { provide: BoardDetailSlice, useValue: mockBoardDetailSlice },
        { provide: CreateColumnUseCase, useValue: mockCreateColumnUseCase },
        { provide: UpdateColumnUseCase, useValue: mockUpdateColumnUseCase },
        { provide: DeleteColumnUseCase, useValue: mockDeleteColumnUseCase },
        { provide: ReorderColumnsUseCase, useValue: mockReorderColumnsUseCase },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    slice = TestBed.inject(BoardColumnsSlice);
    slice.setColumns([sampleColumn1, sampleColumn2]);
  });

  it('should initialize with provided columns and not adding', () => {
    expect(slice.columns().length).toBe(2);
    expect(slice.isAddingColumn()).toBe(false);
  });

  describe('createColumn', () => {
    it('should ignore empty title', () => {
      slice.createColumn('b-1', '   ');
      expect(mockCreateColumnUseCase.execute).not.toHaveBeenCalled();
    });

    it('should create column, append to state, show toast and call onSuccess', () => {
      const newCol: ColumnSummary = {
        id: 'col-3',
        title: 'Review',
        position: 2,
        isDoneColumn: false,
        boardId: 'b-1',
        cards: [],
      };
      mockCreateColumnUseCase.execute.mockReturnValue(of(newCol));
      const onSuccessSpy = vi.fn();

      slice.createColumn('b-1', 'Review', false, onSuccessSpy);

      expect(mockCreateColumnUseCase.execute).toHaveBeenCalledWith('b-1', {
        title: 'Review',
        isDoneColumn: false,
      });
      expect(slice.columns().length).toBe(3);
      expect(slice.columns()[2].id).toBe('col-3');
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã thêm danh sách "Review"');
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  describe('updateColumn', () => {
    it('should ignore if title unchanged and isDoneColumn unchanged', () => {
      slice.updateColumn('col-1', 'To Do', false);
      expect(mockUpdateColumnUseCase.execute).not.toHaveBeenCalled();
    });

    it('should optimistically update, call usecase and show toast on success', () => {
      const updated: ColumnSummary = { ...sampleColumn1, title: 'In Progress' };
      mockUpdateColumnUseCase.execute.mockReturnValue(of(updated));
      const onSuccessSpy = vi.fn();

      slice.updateColumn('col-1', 'In Progress', false, onSuccessSpy);

      expect(mockUpdateColumnUseCase.execute).toHaveBeenCalledWith('b-1', 'col-1', {
        title: 'In Progress',
        isDoneColumn: false,
      });
      expect(slice.columns()[0].title).toBe('In Progress');
      expect(onSuccessSpy).toHaveBeenCalled();
    });

    it('should rollback on error and notify error', () => {
      mockUpdateColumnUseCase.execute.mockReturnValue(
        throwError(() => new Error('Server error')),
      );
      const onErrorSpy = vi.fn();

      slice.updateColumn('col-1', 'Renamed', false, undefined, onErrorSpy);

      expect(slice.columns()[0].title).toBe('To Do');
      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(onErrorSpy).toHaveBeenCalled();
    });
  });

  describe('deleteColumn', () => {
    it('should optimistically delete, call usecase, notify and trigger callback on success', () => {
      mockDeleteColumnUseCase.execute.mockReturnValue(of(true));
      const onSuccessSpy = vi.fn();

      slice.deleteColumn('col-1', onSuccessSpy);

      expect(mockDeleteColumnUseCase.execute).toHaveBeenCalledWith('b-1', 'col-1');
      expect(slice.columns().length).toBe(1);
      expect(slice.columns()[0].id).toBe('col-2');
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã xoá cột "To Do" thành công.');
      expect(onSuccessSpy).toHaveBeenCalled();
    });

    it('should rollback on delete failure', () => {
      mockDeleteColumnUseCase.execute.mockReturnValue(
        throwError(() => ({ message: 'Cannot delete column' })),
      );
      const onErrorSpy = vi.fn();

      slice.deleteColumn('col-1', undefined, onErrorSpy);

      expect(slice.columns().length).toBe(2);
      expect(slice.columns()[0].id).toBe('col-1');
      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(onErrorSpy).toHaveBeenCalledWith('Cannot delete column');
    });
  });

  describe('reorderColumns', () => {
    it('should not reorder if previousIndex === currentIndex', () => {
      slice.reorderColumns(0, 0);
      expect(mockReorderColumnsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reorder columns optimistically and call usecase', () => {
      mockReorderColumnsUseCase.execute.mockReturnValue(of(true));

      slice.reorderColumns(0, 1);

      expect(slice.columns()[0].id).toBe('col-2');
      expect(slice.columns()[1].id).toBe('col-1');
      expect(mockReorderColumnsUseCase.execute).toHaveBeenCalledWith('b-1', {
        orderedColumnIds: ['col-2', 'col-1'],
      });
    });

    it('should rollback if reorder fails', () => {
      mockReorderColumnsUseCase.execute.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      slice.reorderColumns(0, 1);

      expect(slice.columns()[0].id).toBe('col-1');
      expect(slice.columns()[1].id).toBe('col-2');
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Không thể cập nhật thứ tự cột. Vui lòng thử lại.',
      );
    });
  });

  describe('local helpers & clear', () => {
    it('should update columns locally', () => {
      slice.updateColumnsLocally((cols) => cols.map((c) => ({ ...c, title: 'Prefix ' + c.title })));
      expect(slice.columns()[0].title).toBe('Prefix To Do');
    });

    it('should clear columns', () => {
      slice.clear();
      expect(slice.columns()).toEqual([]);
      expect(slice.isAddingColumn()).toBe(false);
    });
  });
});
