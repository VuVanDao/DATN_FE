import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Subject } from 'rxjs';
import { UserNotification } from '../../domain/models/user-notification.model';
import { UserNotificationRepository } from '../../domain/repositories/user-notification.repository';
import { NotificationRealtimeService } from '../../infrastructure/realtime/notification-realtime.service';
import { AuthStore } from './auth.store';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';
import { WorkspaceStore } from './workspace.store';

@Injectable({
  providedIn: 'root',
})
export class UserNotificationStore {
  private readonly repository = inject(UserNotificationRepository);
  private readonly realtime = inject(NotificationRealtimeService);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(NotificationService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly requests = inject(StoreRequestRunner);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly cancel$ = new Subject<void>();
  private readonly loadCancel$ = new Subject<void>();
  private readonly pageSize = 15;
  private readonly appliedMarkReadIds = new Set<string>();
  private hasInitialized = false;

  private readonly itemsSignal = signal<UserNotification[]>([]);
  private readonly unreadCountSignal = signal<number>(0);
  private readonly totalCountSignal = signal<number>(0);
  private readonly hasMoreSignal = signal<boolean>(false);
  private readonly currentPageSignal = signal<number>(1);
  private readonly unreadOnlySignal = signal<boolean>(false);

  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly isLoadingMoreSignal = signal<boolean>(false);
  private readonly isMarkingAllSignal = signal<boolean>(false);

  readonly items = this.itemsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly totalCount = this.totalCountSignal.asReadonly();
  readonly hasMore = this.hasMoreSignal.asReadonly();
  readonly unreadOnly = this.unreadOnlySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isLoadingMore = this.isLoadingMoreSignal.asReadonly();
  readonly isMarkingAll = this.isMarkingAllSignal.asReadonly();

  constructor() {
    this.authStore.ended$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.reset();
    });

    this.realtime.notificationReceived$
      .pipe(takeUntilDestroyed())
      .subscribe((incoming) => this.handleIncomingNotification(incoming));

    this.realtime.notificationMarkedRead$
      .pipe(takeUntilDestroyed())
      .subscribe((msg) => this.applyMarkedRead(msg.notificationId, msg.readAt));

    this.realtime.notificationsReadAll$
      .pipe(takeUntilDestroyed())
      .subscribe((msg) => this.applyMarkedAllRead(msg.readAt));

    this.realtime.reconnected$.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.hasInitialized && this.authStore.isAuthenticated()) {
        this.loadNotifications(1, false);
      }
    });
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || !this.authStore.isAuthenticated()) {
      return;
    }

    if (this.hasInitialized) {
      return;
    }

    this.hasInitialized = true;
    this.loadNotifications(1, false);
    void this.realtime.startConnection();
  }

  setUnreadOnly(unreadOnly: boolean): void {
    if (this.unreadOnlySignal() === unreadOnly) {
      return;
    }

    this.unreadOnlySignal.set(unreadOnly);
    this.loadNotifications(1, false);
  }

  loadNotifications(pageIndex = 1, append = false): void {
    if (!isPlatformBrowser(this.platformId) || !this.authStore.isAuthenticated()) {
      return;
    }

    if (!append) {
      this.loadCancel$.next();
    }

    this.requests.run({
      loading: append ? this.isLoadingMoreSignal : this.isLoadingSignal,
      request$: this.repository.getNotifications(pageIndex, this.pageSize, this.unreadOnlySignal()),
      cancel$: merge(this.cancel$, this.authStore.ended$, this.loadCancel$),
      fallbackErrorMessage: 'Không thể tải danh sách thông báo',
      toastOnError: false,
      onSuccess: (response) => {
        this.unreadCountSignal.set(response.unreadCount);
        this.totalCountSignal.set(response.totalCount);
        this.hasMoreSignal.set(response.hasMore);
        this.currentPageSignal.set(pageIndex);

        if (append) {
          this.itemsSignal.update((current) => {
            const existingIds = new Set(current.map((item) => item.id));
            const nextItems = response.items.filter((item) => !existingIds.has(item.id));
            return [...current, ...nextItems];
          });
        } else {
          this.itemsSignal.set(response.items);
        }
      },
    });
  }

  loadMore(): void {
    if (!this.hasMoreSignal() || this.isLoadingMoreSignal() || this.isLoadingSignal()) {
      return;
    }
    this.loadNotifications(this.currentPageSignal() + 1, true);
  }

  markAsRead(notification: UserNotification): void {
    if (notification.isRead) {
      return;
    }

    const dummyLoading = signal(false);
    this.requests.run({
      loading: dummyLoading,
      request$: this.repository.markAsRead(notification.id),
      cancel$: merge(this.cancel$, this.authStore.ended$),
      fallbackErrorMessage: 'Không thể đánh dấu đã đọc thông báo',
      toastOnError: false,
      onSuccess: (updated) => {
        this.applyMarkedRead(updated.id, updated.readAt);
      },
    });
  }

  markAllAsRead(): void {
    if (this.unreadCountSignal() === 0 || this.isMarkingAllSignal()) {
      return;
    }

    this.requests.run({
      loading: this.isMarkingAllSignal,
      request$: this.repository.markAllAsRead(),
      cancel$: merge(this.cancel$, this.authStore.ended$),
      fallbackErrorMessage: 'Không thể đánh dấu tất cả thông báo là đã đọc',
      onSuccess: () => {
        this.applyMarkedAllRead(new Date().toISOString());
      },
    });
  }

  private handleIncomingNotification(incoming: UserNotification): void {
    if (this.itemsSignal().some((item) => item.id === incoming.id)) {
      return;
    }

    if (!incoming.isRead) {
      this.unreadCountSignal.update((count) => count + 1);
    }

    if (!this.unreadOnlySignal() || !incoming.isRead) {
      this.itemsSignal.update((list) => [incoming, ...list]);
      this.totalCountSignal.update((total) => total + 1);
    }

    this.toast.info(incoming.content || incoming.title);

    if (incoming.type === 'WorkspaceInvite' && this.workspaceStore.hasLoaded()) {
      this.workspaceStore.loadWorkspaces(true);
    } else if (incoming.type === 'ProjectInvite') {
      const workspaceId = this.extractWorkspaceIdFromTargetUrl(incoming.targetUrl);
      this.workspaceStore.onProjectInviteReceived(workspaceId);
    }
  }

  private extractWorkspaceIdFromTargetUrl(targetUrl: string | null): string | null {
    if (!targetUrl) return null;
    const match = /^\/workspaces\/([^/]+)\/projects\//i.exec(targetUrl);
    return match?.[1] ?? null;
  }

  private applyMarkedRead(notificationId: string, readAt: string | null): void {
    if (this.appliedMarkReadIds.has(notificationId)) {
      return;
    }

    const target = this.itemsSignal().find((item) => item.id === notificationId);
    if (target?.isRead) {
      this.appliedMarkReadIds.add(notificationId);
      return;
    }

    this.appliedMarkReadIds.add(notificationId);
    this.unreadCountSignal.update((count) => Math.max(0, count - 1));

    if (target) {
      if (this.unreadOnlySignal()) {
        this.itemsSignal.update((list) => list.filter((item) => item.id !== notificationId));
        this.totalCountSignal.update((total) => Math.max(0, total - 1));
      } else {
        this.itemsSignal.update((list) =>
          list.map((item) =>
            item.id === notificationId ? { ...item, isRead: true, readAt } : item,
          ),
        );
      }
    }
  }

  private applyMarkedAllRead(readAt: string | null): void {
    this.unreadCountSignal.set(0);
    for (const item of this.itemsSignal()) {
      if (!item.isRead) {
        this.appliedMarkReadIds.add(item.id);
      }
    }

    if (this.unreadOnlySignal()) {
      this.itemsSignal.set([]);
      this.totalCountSignal.set(0);
      this.hasMoreSignal.set(false);
    } else {
      this.itemsSignal.update((list) =>
        list.map((item) => (item.isRead ? item : { ...item, isRead: true, readAt })),
      );
    }
  }

  private reset(): void {
    this.hasInitialized = false;
    this.cancel$.next();
    this.loadCancel$.next();
    this.appliedMarkReadIds.clear();
    this.itemsSignal.set([]);
    this.unreadCountSignal.set(0);
    this.totalCountSignal.set(0);
    this.hasMoreSignal.set(false);
    this.currentPageSignal.set(1);
    this.unreadOnlySignal.set(false);
    this.isLoadingSignal.set(false);
    this.isLoadingMoreSignal.set(false);
    this.isMarkingAllSignal.set(false);
    void this.realtime.stopConnection();
  }
}
