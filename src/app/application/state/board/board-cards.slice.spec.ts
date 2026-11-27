import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardDetail, CardSummary, ColumnSummary } from '../../../domain/models/board-detail.model';
import { CreateCardUseCase } from '../../board/create-card.use-case';
import { DeleteCardUseCase } from '../../board/delete-card.use-case';
import { MoveCardUseCase } from '../../board/move-card.use-case';
import { UpdateCardUseCase } from '../../board/update-card.use-case';
import { NotificationService } from '../../shared/notification.service';
import { StoreRequestRunner } from '../store-request.util';
import { BoardCardsSlice } from './board-cards.slice';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';

describe('BoardCardsSlice', () => {
  let slice: BoardCardsSlice;
  let mockCreateCardUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockMoveCardUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateCardUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDeleteCardUseCase: { execute: ReturnType<typeof vi.fn> };
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
  let columnsSignal: ReturnType<typeof signal<ColumnSummary[]>>;
  let mockBoardColumnsSlice: {
    columns: any;
    updateColumnsLocally: ReturnType<typeof vi.fn>;
    setColumns: ReturnType<typeof vi.fn>;
  };

  const sampleCard1: CardSummary = {
    id: 'c-1',
    title: 'Card 1',
    position: 0,
    type: 'Task',
    priority: 'Medium',
    isCompleted: false,
    columnId: 'col-1',
    reporterId: 'u-1',
    reporterName: 'User 1',
    createdAt: new Date().toISOString(),
    commentsCount: 0,
    storyPoints: 3,
  };

  const sampleCard2: CardSummary = {
    id: 'c-2',
    title: 'Card 2',
    position: 1,
    type: 'Bug',
    priority: 'High',
    isCompleted: false,
    columnId: 'col-1',
    reporterId: 'u-1',
    reporterName: 'User 1',
    createdAt: new Date().toISOString(),
    commentsCount: 0,
    storyPoints: 5,
    isBlocked: true,
  };

  const sampleColumn1: ColumnSummary = {
    id: 'col-1',
    title: 'To Do',
    position: 0,
    isDoneColumn: false,
    boardId: 'b-1',
    cards: [sampleCard1, sampleCard2],
  };

  const sampleColumn2: ColumnSummary = {
    id: 'col-2',
    title: 'Done',
    position: 1,
    isDoneColumn: true,
    boardId: 'b-1',
    cards: [],
  };

  const sampleBoard: BoardDetail = {
    id: 'b-1',
    title: 'Test Board',
    slug: 'test-board',
    type: 'Kanban',
    projectId: 'p-1',
    projectName: 'Test Project',
    isPinned: false,
    activeSprint: {
      id: 'sp-1',
      name: 'Sprint 1',
      boardId: 'b-1',
      projectId: 'p-1',
      createdAt: new Date().toISOString(),
      status: 'Active',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalCards: 2,
      completedCards: 0,
      totalStoryPoints: 8,
      completedStoryPoints: 0,
    },
    columns: [sampleColumn1, sampleColumn2],
  };

  beforeEach(() => {
    mockCreateCardUseCase = { execute: vi.fn() };
    mockMoveCardUseCase = { execute: vi.fn() };
    mockUpdateCardUseCase = { execute: vi.fn() };
    mockDeleteCardUseCase = { execute: vi.fn() };
    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    currentBoardSignal = signal<BoardDetail | null>(sampleBoard);
    mockBoardDetailSlice = {
      currentBoard: currentBoardSignal.asReadonly(),
      updateBoardLocally: vi.fn((updater) => {
        currentBoardSignal.update(updater);
      }),
    };

    columnsSignal = signal<ColumnSummary[]>([
      { ...sampleColumn1, cards: [{ ...sampleCard1 }, { ...sampleCard2 }] },
      { ...sampleColumn2, cards: [] },
    ]);
    mockBoardColumnsSlice = {
      columns: columnsSignal.asReadonly(),
      updateColumnsLocally: vi.fn((updater) => {
        columnsSignal.update(updater);
      }),
      setColumns: vi.fn((cols) => {
        columnsSignal.set(cols);
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        BoardCardsSlice,
        StoreRequestRunner,
        { provide: BoardColumnsSlice, useValue: mockBoardColumnsSlice },
        { provide: BoardDetailSlice, useValue: mockBoardDetailSlice },
        { provide: CreateCardUseCase, useValue: mockCreateCardUseCase },
        { provide: MoveCardUseCase, useValue: mockMoveCardUseCase },
        { provide: UpdateCardUseCase, useValue: mockUpdateCardUseCase },
        { provide: DeleteCardUseCase, useValue: mockDeleteCardUseCase },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    slice = TestBed.inject(BoardCardsSlice);
  });

  it('should initialize with isAddingCard = false', () => {
    expect(slice.isAddingCard()).toBe(false);
  });

  describe('createCard', () => {
    it('should ignore empty title', () => {
      slice.createCard('col-1', '   ');
      expect(mockCreateCardUseCase.execute).not.toHaveBeenCalled();
    });

    it('should create card, update column, update activeSprint and notify on success', () => {
      const newCard: CardSummary = {
        id: 'c-3',
        title: 'New Task',
        position: 2,
        type: 'Task',
        priority: 'Low',
        isCompleted: false,
        columnId: 'col-1',
        reporterId: 'u-1',
        reporterName: 'User 1',
        createdAt: new Date().toISOString(),
        commentsCount: 0,
        storyPoints: 2,
      };
      mockCreateCardUseCase.execute.mockReturnValue(of(newCard));
      const onSuccessSpy = vi.fn();

      slice.createCard('col-1', 'New Task', undefined, 'sp-1', onSuccessSpy);

      expect(mockCreateCardUseCase.execute).toHaveBeenCalled();
      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards.length).toBe(3);
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã tạo thẻ mới');
      expect(onSuccessSpy).toHaveBeenCalledWith(newCard);
    });
  });

  describe('moveCard', () => {
    it('should block moving a blocked card to a Done column', () => {
      slice.moveCard('c-2', 'col-1', 'col-2', 1, 0);

      expect(mockMoveCardUseCase.execute).not.toHaveBeenCalled();
      expect(mockNotificationService.error).toHaveBeenCalled();
    });

    it('should move card within same column optimistically and call usecase', () => {
      mockMoveCardUseCase.execute.mockReturnValue(of(true));

      slice.moveCard('c-1', 'col-1', 'col-1', 0, 1);

      expect(mockMoveCardUseCase.execute).toHaveBeenCalledWith('c-1', {
        targetColumnId: 'col-1',
        newPosition: 1,
      });
      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards[0].id).toBe('c-2');
      expect(col1?.cards[1].id).toBe('c-1');
    });

    it('should move card to done column, mark as completed and update activeSprint stats', () => {
      mockMoveCardUseCase.execute.mockReturnValue(of(true));
      const onCardMovedSpy = vi.fn();
      const onStatusChangedSpy = vi.fn();

      slice.moveCard('c-1', 'col-1', 'col-2', 0, 0, onCardMovedSpy, onStatusChangedSpy);

      expect(mockMoveCardUseCase.execute).toHaveBeenCalledWith('c-1', {
        targetColumnId: 'col-2',
        newPosition: 0,
      });
      const col2 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-2');
      expect(col2?.cards[0].id).toBe('c-1');
      expect(col2?.cards[0].isCompleted).toBe(true);
      expect(onCardMovedSpy).toHaveBeenCalledWith('c-1', 'col-2', true);
      expect(onStatusChangedSpy).toHaveBeenCalled();
    });

    it('should rollback on move failure', () => {
      mockMoveCardUseCase.execute.mockReturnValue(throwError(() => new Error('Move failed')));

      slice.moveCard('c-1', 'col-1', 'col-2', 0, 0);

      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards.length).toBe(2);
      expect(mockNotificationService.error).toHaveBeenCalled();
    });
  });

  describe('moveCardToColumn', () => {
    it('should move card to column directly and notify success', () => {
      mockMoveCardUseCase.execute.mockReturnValue(of(true));
      const onSuccessSpy = vi.fn();

      slice.moveCardToColumn('c-1', 'col-2', onSuccessSpy);

      const col2 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-2');
      expect(col2?.cards[0].id).toBe('c-1');
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã chuyển thẻ sang cột "Done"');
      expect(onSuccessSpy).toHaveBeenCalled();
    });
  });

  describe('updateCardTitle', () => {
    it('should ignore empty title', () => {
      slice.updateCardTitle('c-1', 'col-1', '   ');
      expect(mockUpdateCardUseCase.execute).not.toHaveBeenCalled();
    });

    it('should optimistically update card title in column and notify on success', () => {
      mockUpdateCardUseCase.execute.mockReturnValue(of({ ...sampleCard1, title: 'Renamed Title' }));

      slice.updateCardTitle('c-1', 'col-1', 'Renamed Title');

      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards[0].title).toBe('Renamed Title');
      expect(mockUpdateCardUseCase.execute).toHaveBeenCalledWith('c-1', { title: 'Renamed Title' });
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã cập nhật tiêu đề thẻ');
    });

    it('should rollback on update title failure', () => {
      mockUpdateCardUseCase.execute.mockReturnValue(throwError(() => new Error('Update failed')));

      slice.updateCardTitle('c-1', 'col-1', 'New Title');

      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards[0].title).toBe('Card 1');
      expect(mockNotificationService.error).toHaveBeenCalled();
    });
  });

  describe('deleteCard', () => {
    it('should delete card from column, update activeSprint and notify on success', () => {
      mockDeleteCardUseCase.execute.mockReturnValue(of(true));
      const onCardDeletedSpy = vi.fn();

      slice.deleteCard('c-1', 'col-1', onCardDeletedSpy);

      expect(mockDeleteCardUseCase.execute).toHaveBeenCalledWith('c-1');
      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards.length).toBe(1);
      expect(col1?.cards[0].id).toBe('c-2');
      expect(mockNotificationService.success).toHaveBeenCalledWith('Đã xoá thẻ thành công');
      expect(onCardDeletedSpy).toHaveBeenCalledWith('c-1');
    });
  });

  describe('removeCardLocally and clear', () => {
    it('should remove card locally from columns', () => {
      slice.removeCardLocally('c-1');

      const col1 = mockBoardColumnsSlice.columns().find((c: ColumnSummary) => c.id === 'col-1');
      expect(col1?.cards.length).toBe(1);
      expect(col1?.cards[0].id).toBe('c-2');
    });

    it('should clear slice state', () => {
      slice.clear();
      expect(slice.isAddingCard()).toBe(false);
    });
  });
});
