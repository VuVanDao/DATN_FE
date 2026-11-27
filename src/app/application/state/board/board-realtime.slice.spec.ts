import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BoardDetail,
  CardComment,
  CardDetail,
  CardSummary,
  ColumnSummary,
} from '../../../domain/models/board-detail.model';
import {
  CardCommentAddedMessage,
  CardCreatedMessage,
  CardDeletedMessage,
  CardMovedMessage,
  CardUpdatedMessage,
  ColumnCreatedMessage,
  ColumnDeletedMessage,
  ColumnsReorderedMessage,
  ColumnUpdatedMessage,
} from '../../../domain/models/board-realtime.model';
import { BoardRealtimeService } from '../../../infrastructure/realtime/board-realtime.service';
import { NotificationService } from '../../shared/notification.service';
import { AuthStore } from '../auth.store';
import { BoardColumnsSlice } from './board-columns.slice';
import { BoardDetailSlice } from './board-detail.slice';
import { BoardRealtimeSlice } from './board-realtime.slice';
import { CardDetailSlice } from './card-detail.slice';

describe('BoardRealtimeSlice', () => {
  let slice: BoardRealtimeSlice;

  let columnsReordered$: Subject<ColumnsReorderedMessage>;
  let cardMoved$: Subject<CardMovedMessage>;
  let columnCreated$: Subject<ColumnCreatedMessage>;
  let columnUpdated$: Subject<ColumnUpdatedMessage>;
  let columnDeleted$: Subject<ColumnDeletedMessage>;
  let cardCreated$: Subject<CardCreatedMessage>;
  let cardUpdated$: Subject<CardUpdatedMessage>;
  let cardDeleted$: Subject<CardDeletedMessage>;
  let sprintStarted$: Subject<any>;
  let sprintUpdated$: Subject<any>;
  let sprintCompleted$: Subject<any>;
  let sprintDeleted$: Subject<any>;
  let cardSprintChanged$: Subject<any>;
  let cardDependencyAdded$: Subject<any>;
  let cardDependencyRemoved$: Subject<any>;
  let cardCommentAdded$: Subject<CardCommentAddedMessage>;
  let reconnected$: Subject<void>;

  let authEnded$: Subject<void>;
  let currentUserSignal: ReturnType<typeof signal<any>>;

  let mockBoardRealtimeService: any;
  let mockAuthStore: any;
  let mockNotificationService: any;

  let currentBoardSignal: ReturnType<typeof signal<BoardDetail | null>>;
  let mockBoardDetailSlice: any;

  let columnsSignal: ReturnType<typeof signal<ColumnSummary[]>>;
  let mockBoardColumnsSlice: any;

  let currentCardDetailSignal: ReturnType<typeof signal<CardDetail | null>>;
  let mockCardDetailSlice: any;

  const now = '2026-01-01T00:00:00Z';

  const sampleCard: CardSummary = {
    id: 'c-1',
    title: 'Card 1',
    position: 0,
    type: 'Task',
    priority: 'Medium',
    isCompleted: false,
    columnId: 'col-1',
    reporterId: 'u-1',
    reporterName: 'Reporter 1',
    createdAt: now,
    commentsCount: 0,
    storyPoints: 3,
  };

  const sampleColumn: ColumnSummary = {
    id: 'col-1',
    boardId: 'b-1',
    title: 'To Do',
    position: 0,
    isDoneColumn: false,
    cards: [sampleCard],
  };

  const sampleBoard: BoardDetail = {
    id: 'b-1',
    title: 'Board 1',
    slug: 'board-1',
    type: 'Kanban',
    projectId: 'p-1',
    projectName: 'Project 1',
    isPinned: false,
    columns: [sampleColumn],
    activeSprint: {
      id: 'sp-1',
      name: 'Sprint 1',
      boardId: 'b-1',
      projectId: 'p-1',
      status: 'Active',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      totalStoryPoints: 10,
      completedStoryPoints: 0,
      totalCards: 2,
      completedCards: 0,
      createdAt: now,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    columnsReordered$ = new Subject();
    cardMoved$ = new Subject();
    columnCreated$ = new Subject();
    columnUpdated$ = new Subject();
    columnDeleted$ = new Subject();
    cardCreated$ = new Subject();
    cardUpdated$ = new Subject();
    cardDeleted$ = new Subject();
    sprintStarted$ = new Subject();
    sprintUpdated$ = new Subject();
    sprintCompleted$ = new Subject();
    sprintDeleted$ = new Subject();
    cardSprintChanged$ = new Subject();
    cardDependencyAdded$ = new Subject();
    cardDependencyRemoved$ = new Subject();
    cardCommentAdded$ = new Subject();
    reconnected$ = new Subject();

    mockBoardRealtimeService = {
      columnsReordered$,
      cardMoved$,
      columnCreated$,
      columnUpdated$,
      columnDeleted$,
      cardCreated$,
      cardUpdated$,
      cardDeleted$,
      sprintStarted$,
      sprintUpdated$,
      sprintCompleted$,
      sprintDeleted$,
      cardSprintChanged$,
      cardDependencyAdded$,
      cardDependencyRemoved$,
      cardCommentAdded$,
      reconnected$,
      joinBoard: vi.fn(),
      leaveBoard: vi.fn(),
      stopConnection: vi.fn(),
    };

    authEnded$ = new Subject();
    currentUserSignal = signal({ id: 'user-me', name: 'Current User' });
    mockAuthStore = {
      currentUser: currentUserSignal.asReadonly(),
      ended$: authEnded$,
    };

    mockNotificationService = {
      info: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    };

    currentBoardSignal = signal<BoardDetail | null>(sampleBoard);
    mockBoardDetailSlice = {
      currentBoard: currentBoardSignal.asReadonly(),
      updateBoardLocally: vi.fn((updater: (b: BoardDetail | null) => BoardDetail | null) => {
        currentBoardSignal.update(updater);
      }),
      silentReloadBoard: vi.fn((slug: string, projectId: string, cb?: (b: BoardDetail) => void) => {
        if (currentBoardSignal()) {
          cb?.(currentBoardSignal()!);
        }
      }),
    };

    columnsSignal = signal<ColumnSummary[]>([sampleColumn]);
    mockBoardColumnsSlice = {
      columns: columnsSignal.asReadonly(),
      setColumns: vi.fn((cols: ColumnSummary[]) => {
        columnsSignal.set(cols);
      }),
      updateColumnsLocally: vi.fn((updater: (cols: ColumnSummary[]) => ColumnSummary[]) => {
        columnsSignal.update(updater);
      }),
    };

    currentCardDetailSignal = signal<CardDetail | null>(null);
    mockCardDetailSlice = {
      currentCardDetail: currentCardDetailSignal.asReadonly(),
      updateActiveCardLocally: vi.fn((updater: (d: CardDetail | null) => CardDetail | null) => {
        currentCardDetailSignal.update(updater);
      }),
      clearCardDetail: vi.fn(() => currentCardDetailSignal.set(null)),
      loadCardDetail: vi.fn(),
      applyIncomingCardComment: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        BoardRealtimeSlice,
        { provide: BoardRealtimeService, useValue: mockBoardRealtimeService },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: BoardDetailSlice, useValue: mockBoardDetailSlice },
        { provide: BoardColumnsSlice, useValue: mockBoardColumnsSlice },
        { provide: CardDetailSlice, useValue: mockCardDetailSlice },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    slice = TestBed.inject(BoardRealtimeSlice);
  });

  it('should call joinBoard and leaveBoard on boardRealtimeService', () => {
    slice.joinBoard('b-1');
    expect(mockBoardRealtimeService.joinBoard).toHaveBeenCalledWith('b-1');

    slice.leaveBoard('b-1');
    expect(mockBoardRealtimeService.leaveBoard).toHaveBeenCalledWith('b-1');
  });

  it('should handle columnCreated event and add new column', () => {
    columnCreated$.next({
      boardId: 'b-1',
      columnId: 'col-2',
      title: 'In Progress',
      position: 1,
      isDoneColumn: false,
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.setColumns).toHaveBeenCalled();
    const cols = columnsSignal();
    expect(cols.length).toBe(2);
    expect(cols[1].title).toBe('In Progress');
    expect(mockNotificationService.info).toHaveBeenCalledWith('Cột "In Progress" vừa được thêm bởi thành viên khác.');
  });

  it('should suppress columnCreated if created by own user (echo suppression)', () => {
    columnCreated$.next({
      boardId: 'b-1',
      columnId: 'col-own',
      title: 'Own Col',
      position: 1,
      isDoneColumn: false,
      changedByUserId: 'user-me',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.setColumns).not.toHaveBeenCalled();
    expect(mockNotificationService.info).not.toHaveBeenCalled();
  });

  it('should handle columnUpdated event and update column properties', () => {
    columnUpdated$.next({
      boardId: 'b-1',
      columnId: 'col-1',
      title: 'Renamed To Do',
      position: 0,
      isDoneColumn: false,
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.updateColumnsLocally).toHaveBeenCalled();
    expect(columnsSignal()[0].title).toBe('Renamed To Do');
  });

  it('should handle columnDeleted event and remove column', () => {
    columnDeleted$.next({
      boardId: 'b-1',
      columnId: 'col-1',
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.updateColumnsLocally).toHaveBeenCalled();
    expect(columnsSignal().length).toBe(0);
    expect(mockNotificationService.warning).toHaveBeenCalled();
  });

  it('should handle cardCreated event in current board', () => {
    const newCardSummary: CardSummary = {
      id: 'c-2',
      title: 'New Card 2',
      position: 1,
      type: 'Bug',
      priority: 'High',
      isCompleted: false,
      columnId: 'col-1',
      reporterId: 'u-2',
      reporterName: 'User 2',
      createdAt: now,
      commentsCount: 0,
      storyPoints: 5,
      sprintId: 'sp-1',
    };

    cardCreated$.next({
      boardId: 'b-1',
      card: newCardSummary,
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.updateColumnsLocally).toHaveBeenCalled();
    expect(columnsSignal()[0].cards.length).toBe(2);
    expect(mockNotificationService.info).toHaveBeenCalledWith('Thẻ "New Card 2" vừa được thêm bởi thành viên khác.');
  });

  it('should handle cardDeleted event and clear active modal if viewing that card', () => {
    currentCardDetailSignal.set({
      ...sampleCard,
      description: 'Detail',
      comments: [],
    });

    cardDeleted$.next({
      boardId: 'b-1',
      cardId: 'c-1',
      columnId: 'col-1',
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.updateColumnsLocally).toHaveBeenCalled();
    expect(mockCardDetailSlice.clearCardDetail).toHaveBeenCalled();
    expect(mockNotificationService.warning).toHaveBeenCalledWith('Thẻ bạn đang xem vừa bị xoá bởi thành viên khác.');
  });

  it('should handle columnsReordered event and sort columns', () => {
    const colA: ColumnSummary = { ...sampleColumn, id: 'col-a', position: 0 };
    const colB: ColumnSummary = { ...sampleColumn, id: 'col-b', position: 1 };
    columnsSignal.set([colA, colB]);

    columnsReordered$.next({
      boardId: 'b-1',
      orderedColumnIds: ['col-b', 'col-a'],
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.setColumns).toHaveBeenCalled();
    const resultCols = columnsSignal();
    expect(resultCols[0].id).toBe('col-b');
    expect(resultCols[1].id).toBe('col-a');
    expect(mockNotificationService.warning).toHaveBeenCalled();
  });

  it('should handle cardMoved event across columns and update positions', () => {
    const col2: ColumnSummary = {
      id: 'col-2',
      boardId: 'b-1',
      title: 'Done',
      position: 1,
      isDoneColumn: true,
      cards: [],
    };
    columnsSignal.set([{ ...sampleColumn, cards: [{ ...sampleCard }] }, col2]);

    cardMoved$.next({
      boardId: 'b-1',
      cardId: 'c-1',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-2',
      newPosition: 0,
      isCompleted: true,
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.updateColumnsLocally).toHaveBeenCalled();
    const cols = columnsSignal();
    expect(cols[0].cards.length).toBe(0);
    expect(cols[1].cards.length).toBe(1);
    expect(cols[1].cards[0].isCompleted).toBe(true);
    expect(mockNotificationService.warning).toHaveBeenCalled();
  });

  it('should handle sprintStarted event with silentReloadBoard', () => {
    sprintStarted$.next({
      boardId: 'b-1',
      sprint: { id: 'sp-1', name: 'Sprint 1' },
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardDetailSlice.silentReloadBoard).toHaveBeenCalled();
    expect(mockNotificationService.info).toHaveBeenCalledWith('Sprint "Sprint 1" vừa được kích hoạt bởi thành viên khác.');
  });

  it('should handle cardCommentAdded and delegate to cardDetail.applyIncomingCardComment', () => {
    const comment: CardComment = {
      id: 'cmt-1',
      cardId: 'c-1',
      userId: 'user-other',
      username: 'Other User',
      contentText: 'Nice progress',
      createdAt: now,
    };

    cardCommentAdded$.next({
      boardId: 'b-1',
      comment,
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockCardDetailSlice.applyIncomingCardComment).toHaveBeenCalledWith(comment);
    expect(mockNotificationService.info).toHaveBeenCalled();
  });

  it('should call stopConnection when auth session ends', () => {
    authEnded$.next();
    expect(mockBoardRealtimeService.stopConnection).toHaveBeenCalled();
  });

  it('should unsubscribe from all events on destroy()', () => {
    slice.destroy();

    columnCreated$.next({
      boardId: 'b-1',
      columnId: 'col-x',
      title: 'X',
      position: 2,
      isDoneColumn: false,
      changedByUserId: 'user-other',
      occurredAt: now,
    });

    expect(mockBoardColumnsSlice.setColumns).not.toHaveBeenCalled();
  });
});
