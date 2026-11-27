import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BoardDetail,
  CardComment,
  CardDetail,
  CardSummary,
  ColumnSummary,
} from '../../../domain/models/board-detail.model';
import { AddCardCommentUseCase } from '../../board/add-card-comment.use-case';
import { GetCardDetailUseCase } from '../../board/get-card-detail.use-case';
import { UpdateCardUseCase } from '../../board/update-card.use-case';
import { NotificationService } from '../../shared/notification.service';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';
import { CardDetailSlice } from './card-detail.slice';

describe('CardDetailSlice', () => {
  let slice: CardDetailSlice;
  let mockGetCardDetailUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateCardUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockAddCardCommentUseCase: { execute: ReturnType<typeof vi.fn> };
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
    setBoard: ReturnType<typeof vi.fn>;
  };
  let columnsSignal: ReturnType<typeof signal<ColumnSummary[]>>;
  let mockBoardColumnsSlice: {
    columns: any;
    updateColumnsLocally: ReturnType<typeof vi.fn>;
    setColumns: ReturnType<typeof vi.fn>;
  };

  const sampleCardSummary: CardSummary = {
    id: 'card-1',
    title: 'Original Title',
    position: 0,
    type: 'Task',
    priority: 'Medium',
    isCompleted: false,
    columnId: 'col-1',
    reporterId: 'user-1',
    reporterName: 'Reporter One',
    createdAt: new Date().toISOString(),
    commentsCount: 2,
    storyPoints: 3,
  };

  const sampleColumn: ColumnSummary = {
    id: 'col-1',
    boardId: 'b-1',
    title: 'To Do',
    position: 0,
    isDoneColumn: false,
    cards: [sampleCardSummary],
  };

  const sampleCardDetail: CardDetail = {
    id: 'card-1',
    title: 'Original Title',
    description: 'Detailed description',
    position: 0,
    type: 'Task',
    priority: 'Medium',
    isCompleted: false,
    columnId: 'col-1',
    reporterId: 'user-1',
    reporterName: 'Reporter One',
    createdAt: new Date().toISOString(),
    commentsCount: 2,
    storyPoints: 3,
    blocking: [],
    blockedBy: [],
    comments: [],
  };

  const sampleBoard: BoardDetail = {
    id: 'b-1',
    title: 'Board One',
    slug: 'board-one',
    type: 'Kanban',
    projectId: 'p-1',
    projectName: 'Test Project',
    isPinned: false,
    columns: [sampleColumn],
    activeSprint: {
      id: 'sp-1',
      name: 'Sprint 1',
      status: 'Active',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      totalStoryPoints: 10,
      completedStoryPoints: 3,
      totalCards: 5,
      completedCards: 1,
      projectId: 'p-1',
      boardId: 'b-1',
      createdAt: '2026-01-01',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCardDetailUseCase = { execute: vi.fn() };
    mockUpdateCardUseCase = { execute: vi.fn() };
    mockAddCardCommentUseCase = { execute: vi.fn() };
    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    currentBoardSignal = signal<BoardDetail | null>(sampleBoard);
    mockBoardDetailSlice = {
      currentBoard: currentBoardSignal.asReadonly(),
      updateBoardLocally: vi.fn((updater: (b: BoardDetail | null) => BoardDetail | null) => {
        currentBoardSignal.update(updater);
      }),
      setBoard: vi.fn((board: BoardDetail | null) => {
        currentBoardSignal.set(board);
      }),
    };

    columnsSignal = signal<ColumnSummary[]>([sampleColumn]);
    mockBoardColumnsSlice = {
      columns: columnsSignal.asReadonly(),
      updateColumnsLocally: vi.fn((updater: (cols: ColumnSummary[]) => ColumnSummary[]) => {
        columnsSignal.update(updater);
      }),
      setColumns: vi.fn((cols: ColumnSummary[]) => {
        columnsSignal.set(cols);
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        CardDetailSlice,
        { provide: GetCardDetailUseCase, useValue: mockGetCardDetailUseCase },
        { provide: UpdateCardUseCase, useValue: mockUpdateCardUseCase },
        { provide: AddCardCommentUseCase, useValue: mockAddCardCommentUseCase },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: BoardDetailSlice, useValue: mockBoardDetailSlice },
        { provide: BoardColumnsSlice, useValue: mockBoardColumnsSlice },
      ],
    });

    slice = TestBed.inject(CardDetailSlice);
  });

  it('should initialize with null card detail and isLoadingCardDetail false', () => {
    expect(slice.currentCardDetail()).toBeNull();
    expect(slice.isLoadingCardDetail()).toBe(false);
  });

  it('should load card detail successfully and synchronize card fields into columns', () => {
    const detailFromApi: CardDetail = {
      ...sampleCardDetail,
      title: 'Updated from API',
      storyPoints: 5,
      isBlocked: true,
      blockedByCount: 1,
    };
    mockGetCardDetailUseCase.execute.mockReturnValue(of(detailFromApi));

    slice.loadCardDetail('card-1');

    expect(mockGetCardDetailUseCase.execute).toHaveBeenCalledWith('card-1');
    expect(slice.currentCardDetail()).toEqual(detailFromApi);
    expect(slice.isLoadingCardDetail()).toBe(false);

    // Kiểm tra đồng bộ ngược vào columns
    const updatedCardInCol = columnsSignal()[0].cards[0];
    expect(updatedCardInCol.title).toBe('Updated from API');
    expect(updatedCardInCol.storyPoints).toBe(5);
    expect(updatedCardInCol.isBlocked).toBe(true);
    expect(updatedCardInCol.blockedByCount).toBe(1);
  });

  it('should handle load card detail error and show error notification', () => {
    mockGetCardDetailUseCase.execute.mockReturnValue(
      throwError(() => new Error('Server error')),
    );
    const onError = vi.fn();

    slice.loadCardDetail('card-1', onError);

    expect(slice.currentCardDetail()).toBeNull();
    expect(slice.isLoadingCardDetail()).toBe(false);
    expect(mockNotificationService.error).toHaveBeenCalledWith('Không thể tải chi tiết thẻ.');
    expect(onError).toHaveBeenCalledWith('Server error');
  });

  it('should clear card detail', () => {
    slice.setCardDetailLocally(sampleCardDetail);
    expect(slice.currentCardDetail()).toEqual(sampleCardDetail);

    slice.clearCardDetail();

    expect(slice.currentCardDetail()).toBeNull();
    expect(slice.isLoadingCardDetail()).toBe(false);
  });

  it('should clear card detail if active card matches given cardId', () => {
    slice.setCardDetailLocally(sampleCardDetail);

    slice.clearIfActive('other-card');
    expect(slice.currentCardDetail()).toEqual(sampleCardDetail);

    slice.clearIfActive('card-1');
    expect(slice.currentCardDetail()).toBeNull();
  });

  it('should update active card locally via updater function', () => {
    slice.setCardDetailLocally(sampleCardDetail);

    slice.updateActiveCardLocally((d) => (d ? { ...d, title: 'Locally Changed' } : null));

    expect(slice.currentCardDetail()?.title).toBe('Locally Changed');
  });

  it('should update card optimistically and invoke onStatusChanged when completed status changes', () => {
    slice.setCardDetailLocally(sampleCardDetail);
    const updatedApiResult: CardSummary = {
      ...sampleCardSummary,
      title: 'New Title',
      isCompleted: true,
    };
    mockUpdateCardUseCase.execute.mockReturnValue(of(updatedApiResult));

    const onSuccess = vi.fn();
    const onStatusChanged = vi.fn();

    slice.updateCard(
      'card-1',
      { title: 'New Title', isCompleted: true },
      onSuccess,
      undefined,
      false,
      onStatusChanged,
    );

    expect(mockUpdateCardUseCase.execute).toHaveBeenCalled();
    expect(slice.currentCardDetail()?.title).toBe('New Title');
    expect(slice.currentCardDetail()?.isCompleted).toBe(true);
    expect(mockNotificationService.success).toHaveBeenCalledWith('Đã lưu thông tin thẻ thành công');
    expect(onSuccess).toHaveBeenCalledWith(updatedApiResult);
    expect(onStatusChanged).toHaveBeenCalled();
  });

  it('should rollback columns and card detail when updateCard fails', () => {
    slice.setCardDetailLocally(sampleCardDetail);
    mockUpdateCardUseCase.execute.mockReturnValue(
      throwError(() => new Error('Update failed')),
    );

    const onError = vi.fn();

    slice.updateCard(
      'card-1',
      { title: 'Should Fail Title' },
      undefined,
      onError,
    );

    expect(mockBoardColumnsSlice.setColumns).toHaveBeenCalled();
    expect(slice.currentCardDetail()?.title).toBe('Original Title');
    expect(mockNotificationService.error).toHaveBeenCalledWith('Không thể cập nhật thông tin thẻ.');
    expect(onError).toHaveBeenCalledWith('Update failed');
  });

  it('should add card comment and apply incoming comment', () => {
    slice.setCardDetailLocally(sampleCardDetail);
    const newComment: CardComment = {
      id: 'comment-1',
      cardId: 'card-1',
      userId: 'user-1',
      username: 'User One',
      userAvatarUrl: null,
      contentText: 'Hello world',
      createdAt: new Date().toISOString(),
    };
    mockAddCardCommentUseCase.execute.mockReturnValue(of(newComment));

    const onSuccess = vi.fn();
    slice.addCardComment('card-1', '  Hello world  ', onSuccess);

    expect(mockAddCardCommentUseCase.execute).toHaveBeenCalledWith('card-1', 'Hello world');
    expect(mockNotificationService.success).toHaveBeenCalledWith('Đã gửi bình luận');
    expect(onSuccess).toHaveBeenCalledWith(newComment);

    const currentDetail = slice.currentCardDetail();
    expect(currentDetail?.commentsCount).toBe(3);
    expect(currentDetail?.comments[0].contentText).toBe('Hello world');
  });

  it('should ignore blank comment content in addCardComment', () => {
    slice.addCardComment('card-1', '   ');
    expect(mockAddCardCommentUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle addCardComment error', () => {
    mockAddCardCommentUseCase.execute.mockReturnValue(
      throwError(() => new Error('Comment failed')),
    );

    slice.addCardComment('card-1', 'Some comment');

    expect(mockNotificationService.error).toHaveBeenCalledWith(
      'Không thể gửi bình luận. Vui lòng thử lại.',
    );
  });

  it('should apply incoming comment and avoid duplicates (deduplication)', () => {
    slice.setCardDetailLocally(sampleCardDetail);
    const comment: CardComment = {
      id: 'cmt-echo-1',
      cardId: 'card-1',
      userId: 'user-2',
      username: 'User Two',
      userAvatarUrl: null,
      contentText: 'Echo test',
      createdAt: new Date().toISOString(),
    };

    const firstResult = slice.applyIncomingCardComment(comment);
    expect(firstResult).toBe(true);
    expect(slice.currentCardDetail()?.commentsCount).toBe(3);

    // Apply lại cùng ID comment -> deduplicated
    const secondResult = slice.applyIncomingCardComment(comment);
    expect(secondResult).toBe(false);
    expect(slice.currentCardDetail()?.commentsCount).toBe(3);
  });

  it('should reset all state and comment tracking on clear()', () => {
    slice.setCardDetailLocally(sampleCardDetail);

    slice.clear();

    expect(slice.currentCardDetail()).toBeNull();
    expect(slice.isLoadingCardDetail()).toBe(false);
  });
});
