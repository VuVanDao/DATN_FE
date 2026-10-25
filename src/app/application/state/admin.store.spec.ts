import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { Mock, vi } from 'vitest';
import { GetUserManagementParams, UserManagement } from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { PagedResult } from '../../shared/models/paged-result.model';
import { SessionService } from '../auth/session.service';
import { NotificationService } from '../shared/notification.service';
import { AdminStore } from './admin.store';

function page(
  items: UserManagement[] = [],
  pageIndex = 1,
  totalCount = items.length,
): PagedResult<UserManagement> {
  return {
    items,
    pageIndex,
    totalCount,
    pageSize: 10,
    totalPages: Math.ceil(totalCount / 10),
    hasNextPage: false,
    hasPreviousPage: pageIndex > 1,
  };
}
const user: UserManagement = {
  id: 'user',
  email: 'user@test.local',
  userName: 'User',
  role: 'User',
  isActive: true,
  isDeleted: false,
};

describe('AdminStore filtered lists', () => {
  let store: AdminStore;
  let ended$: Subject<void>;
  let getUsers: Mock<(params: GetUserManagementParams) => Observable<PagedResult<UserManagement>>>;
  let status$: Subject<boolean>;

  beforeEach(() => {
    ended$ = new Subject();
    status$ = new Subject();
    getUsers = vi.fn(() => of(page([user])));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AdminRepository,
          useValue: { getUsers, updateUserStatus: vi.fn(() => status$) },
        },
        { provide: SessionService, useValue: { ended$ } },
        {
          provide: NotificationService,
          useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
        },
      ],
    });
    store = TestBed.inject(AdminStore);
  });

  it('refreshes the active filter after locking a user', () => {
    store.setStatusFilter('active');
    expect(store.users()).toHaveLength(1);
    getUsers.mockReturnValueOnce(of(page()));
    store.updateUserStatus({ userId: user.id, isActive: false });
    status$.next(true);
    status$.complete();
    expect(getUsers).toHaveBeenLastCalledWith(expect.objectContaining({ isActive: true }));
    expect(store.users()).toEqual([]);
    expect(store.totalCount()).toBe(0);
    expect(store.isSubmitting()).toBe(false);
  });

  it('moves to the last valid page when a deletion empties the final page', () => {
    getUsers.mockReturnValueOnce(of(page([user], 1, 11)));
    store.loadUsers();
    getUsers.mockReturnValueOnce(of(page([], 2, 10))).mockReturnValueOnce(of(page([user], 1, 10)));
    store.setPage(2);
    expect(store.pageIndex()).toBe(1);
    expect(store.users()).toEqual([user]);
    expect(store.isLoading()).toBe(false);
  });

  it('discards an older search response and cancels pending writes on logout', () => {
    const first = new Subject<PagedResult<UserManagement>>();
    const second = new Subject<PagedResult<UserManagement>>();
    getUsers.mockReturnValueOnce(first).mockReturnValueOnce(second);
    store.setSearch('first');
    store.setSearch('second');
    second.next(page([user]));
    second.complete();
    first.next(page([]));
    expect(store.users()).toEqual([user]);
    store.updateUserStatus({ userId: user.id, isActive: false });
    ended$.next();
    status$.next(true);
    expect(store.users()).toEqual([]);
    expect(store.isSubmitting()).toBe(false);
    expect(store.searchQuery()).toBe('');
  });
});
