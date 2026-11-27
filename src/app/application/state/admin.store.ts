import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Observable, of, Subject, switchMap } from 'rxjs';
import {
  AdminUpdateUserRequest,
  CreateUserRequest,
  GetUserManagementParams,
  Role,
  UpdateUserStatusRequest,
  UserManagement,
} from '../../domain/models/admin.model';
import { AssignUserRoleUseCase } from '../admin/assign-user-role.use-case';
import { CreateUserUseCase } from '../admin/create-user.use-case';
import { DeleteUserUseCase } from '../admin/delete-user.use-case';
import { GetRolesUseCase } from '../admin/get-roles.use-case';
import { GetUsersUseCase } from '../admin/get-users.use-case';
import { UpdateUserStatusUseCase } from '../admin/update-user-status.use-case';
import { UpdateUserUseCase } from '../admin/update-user.use-case';
import { AuthStore } from './auth.store';
import { NotificationService } from '../shared/notification.service';
import { StoreRequestRunner } from './store-request.util';

export type UserStatusFilter = 'all' | 'active' | 'inactive';

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly getUsers = inject(GetUsersUseCase);
  private readonly getRoles = inject(GetRolesUseCase);
  private readonly updateStatus = inject(UpdateUserStatusUseCase);
  private readonly assign = inject(AssignUserRoleUseCase);
  private readonly create = inject(CreateUserUseCase);
  private readonly remove = inject(DeleteUserUseCase);
  private readonly update = inject(UpdateUserUseCase);
  private readonly requests = inject(StoreRequestRunner);
  private readonly notifications = inject(NotificationService);
  private readonly authStore = inject(AuthStore);
  private readonly usersCancel$ = new Subject<void>();
  private readonly _users = signal<UserManagement[]>([]);
  private readonly _roles = signal<Role[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _pageIndex = signal(1);
  private readonly _pageSize = signal(10);
  private readonly _totalPages = signal(1);
  private readonly _searchQuery = signal('');
  private readonly _statusFilter = signal<UserStatusFilter>('all');
  private readonly _isLoading = signal(false);
  private readonly _isLoadingRoles = signal(false);
  private readonly _isSubmitting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly pageIndex = this._pageIndex.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly errorMessage = this._error.asReadonly();
  readonly stats = computed(() => ({
    total: this._totalCount(),
    activeCount: this._users().filter((user) => user.isActive).length,
    inactiveCount: this._users().filter((user) => !user.isActive).length,
  }));

  constructor() {
    this.authStore.ended$.pipe(takeUntilDestroyed()).subscribe(() => this.clear());
  }

  loadUsers(): void {
    this.usersCancel$.next();
    this._error.set(null);
    const params: GetUserManagementParams = {
      pageIndex: this._pageIndex(),
      pageSize: this._pageSize(),
      search: this._searchQuery() || undefined,
      isActive: this._statusFilter() === 'all' ? undefined : this._statusFilter() === 'active',
    };
    this.requests.run({
      loading: this._isLoading,
      cancel$: merge(this.usersCancel$, this.authStore.ended$),
      request$: this.getUsers.execute(params).pipe(
        switchMap((result) => {
          const lastPage = Math.max(1, result.totalPages);
          if ((params.pageIndex ?? 1) <= lastPage) return of(result);
          this._pageIndex.set(lastPage);
          return this.getUsers.execute({ ...params, pageIndex: lastPage });
        }),
      ),
      fallbackErrorMessage: 'Không thể tải danh sách người dùng',
      toastOnError: false,
      onSuccess: (result) => {
        this._users.set(result.items);
        this._totalCount.set(result.totalCount);
        this._pageIndex.set(Math.max(1, result.pageIndex));
        this._totalPages.set(Math.max(1, result.totalPages));
      },
      onError: (message) => {
        this._users.set([]);
        this._error.set(message);
      },
    });
  }

  loadRoles(): void {
    if (this._isLoadingRoles() || this._roles().length) return;
    this.requests.run({
      loading: this._isLoadingRoles,
      request$: this.getRoles.execute(),
      cancel$: this.authStore.ended$,
      fallbackErrorMessage: 'Không thể tải danh sách vai trò',
      onSuccess: (roles) => this._roles.set(roles),
    });
  }

  setSearch(query: string): void {
    if (this._searchQuery() === query.trim()) return;
    this._searchQuery.set(query.trim());
    this._pageIndex.set(1);
    this.loadUsers();
  }
  setStatusFilter(status: UserStatusFilter): void {
    if (this._statusFilter() === status) return;
    this._statusFilter.set(status);
    this._pageIndex.set(1);
    this.loadUsers();
  }
  setPage(page: number): void {
    if (page < 1 || page > this._totalPages() || page === this._pageIndex()) return;
    this._pageIndex.set(page);
    this.loadUsers();
  }
  setPageSize(size: number): void {
    if (!Number.isInteger(size) || size < 1 || size === this._pageSize()) return;
    this._pageSize.set(size);
    this._pageIndex.set(1);
    this.loadUsers();
  }

  updateUserStatus(request: UpdateUserStatusRequest, onSuccess?: () => void): void {
    this.submit(
      this.updateStatus.execute(request),
      request.isActive ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công',
      onSuccess,
    );
  }
  assignRole(userId: string, roleId: string, onSuccess?: () => void): void {
    this.submit(
      this.assign.execute(userId, roleId),
      'Cập nhật vai trò người dùng thành công',
      onSuccess,
    );
  }
  createUser(request: CreateUserRequest, onSuccess?: () => void): void {
    this.submit(this.create.execute(request), 'Tạo người dùng mới thành công', onSuccess);
  }
  deleteUser(userId: string, onSuccess?: () => void): void {
    this.submit(this.remove.execute(userId), 'Xóa người dùng thành công', onSuccess);
  }
  updateUser(userId: string, request: AdminUpdateUserRequest, onSuccess?: () => void): void {
    this.submit(
      this.update.execute(userId, request),
      'Cập nhật thông tin người dùng thành công',
      onSuccess,
    );
  }

  clear(): void {
    this.usersCancel$.next();
    this._users.set([]);
    this._roles.set([]);
    this._totalCount.set(0);
    this._pageIndex.set(1);
    this._pageSize.set(10);
    this._totalPages.set(1);
    this._searchQuery.set('');
    this._statusFilter.set('all');
    this._error.set(null);
  }

  private submit<T>(request$: Observable<T>, message: string, onSuccess?: () => void): void {
    if (this._isSubmitting()) return;
    this.requests.run({
      loading: this._isSubmitting,
      request$,
      cancel$: this.authStore.ended$,
      fallbackErrorMessage: 'Có lỗi xảy ra, vui lòng thử lại',
      onSuccess: () => {
        this.notifications.success(message);
        this.loadUsers();
        onSuccess?.();
      },
    });
  }
}
