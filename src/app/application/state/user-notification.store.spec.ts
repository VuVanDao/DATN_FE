import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UserNotification,
  UserNotificationList,
} from '../../domain/models/user-notification.model';
import { UserNotificationRepository } from '../../domain/repositories/user-notification.repository';
import {
  NotificationMarkedReadMessage,
  NotificationRealtimeService,
  NotificationsReadAllMessage,
} from '../../infrastructure/realtime/notification-realtime.service';
import { SessionService } from '../auth/session.service';
import { NotificationService } from '../shared/notification.service';
import { UserNotificationStore } from './user-notification.store';
import { WorkspaceStore } from './workspace.store';

function makeNotification(overrides: Partial<UserNotification> = {}): UserNotification {
  return {
    id: 'notif-1',
    receiverId: 'user-1',
    senderId: 'owner-1',
    senderName: 'Owner',
    senderAvatarUrl: null,
    title: 'Lời mời không gian làm việc',
    content: 'Owner đã thêm bạn vào không gian làm việc "Team Alpha"',
    type: 'WorkspaceInvite',
    entityType: 'Workspace',
    entityId: 'ws-1',
    targetUrl: '/workspaces/team-alpha',
    isRead: false,
    readAt: null,
    createdAt: '2026-11-12T00:00:00Z',
    ...overrides,
  };
}

describe('UserNotificationStore', () => {
  let store: UserNotificationStore;
  let repository: {
    getNotifications: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllAsRead: ReturnType<typeof vi.fn>;
  };
  let notificationReceived$: Subject<UserNotification>;
  let notificationMarkedRead$: Subject<NotificationMarkedReadMessage>;
  let notificationsReadAll$: Subject<NotificationsReadAllMessage>;
  let reconnected$: Subject<void>;
  let ended$: Subject<void>;
  let realtime: {
    notificationReceived$: Subject<UserNotification>;
    notificationMarkedRead$: Subject<NotificationMarkedReadMessage>;
    notificationsReadAll$: Subject<NotificationsReadAllMessage>;
    reconnected$: Subject<void>;
    startConnection: ReturnType<typeof vi.fn>;
    stopConnection: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let workspaceStore: {
    hasLoaded: ReturnType<typeof signal<boolean>>;
    loadWorkspaces: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    notificationReceived$ = new Subject<UserNotification>();
    notificationMarkedRead$ = new Subject<NotificationMarkedReadMessage>();
    notificationsReadAll$ = new Subject<NotificationsReadAllMessage>();
    reconnected$ = new Subject<void>();
    ended$ = new Subject<void>();

    repository = {
      getNotifications: vi.fn().mockReturnValue(
        of<UserNotificationList>({
          unreadCount: 1,
          totalCount: 1,
          hasMore: false,
          items: [makeNotification()],
        }),
      ),
      markAsRead: vi.fn((id: string) =>
        of(makeNotification({ id, isRead: true, readAt: '2026-11-12T00:10:00Z' })),
      ),
      markAllAsRead: vi.fn().mockReturnValue(of(1)),
    };

    realtime = {
      notificationReceived$,
      notificationMarkedRead$,
      notificationsReadAll$,
      reconnected$,
      startConnection: vi.fn().mockResolvedValue(undefined),
      stopConnection: vi.fn().mockResolvedValue(undefined),
    };

    toast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    workspaceStore = {
      hasLoaded: signal(true),
      loadWorkspaces: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserNotificationStore,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: UserNotificationRepository, useValue: repository },
        { provide: NotificationRealtimeService, useValue: realtime },
        { provide: NotificationService, useValue: toast },
        { provide: WorkspaceStore, useValue: workspaceStore },
        {
          provide: SessionService,
          useValue: {
            isAuthenticated: signal(true),
            ended$: ended$.asObservable(),
          },
        },
      ],
    });

    store = TestBed.inject(UserNotificationStore);
  });

  it('loads notifications and starts SignalR connection on initialize', () => {
    store.initialize();

    expect(repository.getNotifications).toHaveBeenCalledWith(1, 15, false);
    expect(realtime.startConnection).toHaveBeenCalledOnce();
    expect(store.unreadCount()).toBe(1);
    expect(store.items()).toHaveLength(1);
  });

  it('handles incoming realtime notification, deduplicates, toasts, and refreshes workspaces on WorkspaceInvite', () => {
    store.initialize();

    const incoming = makeNotification({
      id: 'notif-2',
      type: 'WorkspaceInvite',
      content: 'Owner đã thêm bạn vào Workspace Mới',
    });
    notificationReceived$.next(incoming);
    notificationReceived$.next(incoming);

    expect(store.items().map((i) => i.id)).toEqual(['notif-2', 'notif-1']);
    expect(store.unreadCount()).toBe(2);
    expect(toast.info).toHaveBeenCalledOnce();
    expect(workspaceStore.loadWorkspaces).toHaveBeenCalledWith(true);
  });

  it('marks one notification read once across REST + SignalR sync and supports markAllAsRead', () => {
    store.initialize();
    const target = store.items()[0];

    store.markAsRead(target);
    notificationMarkedRead$.next({ notificationId: target.id, readAt: '2026-11-12T00:10:00Z' });

    expect(repository.markAsRead).toHaveBeenCalledWith(target.id);
    expect(store.unreadCount()).toBe(0);
    expect(store.items()[0].isRead).toBe(true);

    notificationReceived$.next(makeNotification({ id: 'notif-3', type: 'ProjectInvite' }));
    expect(store.unreadCount()).toBe(1);

    store.markAllAsRead();
    expect(repository.markAllAsRead).toHaveBeenCalledOnce();
    expect(store.unreadCount()).toBe(0);
    expect(store.items().every((i) => i.isRead)).toBe(true);
  });

  it('resets state and disconnects realtime hub when session ends', () => {
    store.initialize();
    ended$.next();

    expect(store.items()).toEqual([]);
    expect(store.unreadCount()).toBe(0);
    expect(realtime.stopConnection).toHaveBeenCalledOnce();
  });
});
