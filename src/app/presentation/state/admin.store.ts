import { computed, inject, Injectable, signal } from '@angular/core';
import {
  UserManagement,
  Role,
  UpdateUserStatusRequest,
  CreateUserRequest,
  AdminUpdateUserRequest,
} from '../../domain/models/admin.model';
import { GetUsersUseCase } from '../../application/admin/get-users.use-case';
import { GetRolesUseCase } from '../../application/admin/get-roles.use-case';
import { UpdateUserStatusUseCase } from '../../application/admin/update-user-status.use-case';
import { AssignUserRoleUseCase } from '../../application/admin/assign-user-role.use-case';
import { CreateUserUseCase } from '../../application/admin/create-user.use-case';
import { DeleteUserUseCase } from '../../application/admin/delete-user.use-case';
import { UpdateUserUseCase } from '../../application/admin/update-user.use-case';
import { toast } from 'ngx-sonner';
import { extractApiErrorMessage } from '../../shared/utils/api-error.util';

@Injectable({
  providedIn: 'root',
})
export class AdminStore {
  // UseCases
  private readonly _getUsersUseCase = inject(GetUsersUseCase);
  private readonly _getRolesUseCase = inject(GetRolesUseCase);
  private readonly _updateUserStatusUseCase = inject(UpdateUserStatusUseCase);
  private readonly _assignUserRoleUseCase = inject(AssignUserRoleUseCase);
  private readonly _createUserUseCase = inject(CreateUserUseCase);
  private readonly _deleteUserUseCase = inject(DeleteUserUseCase);
  private readonly _updateUserUseCase = inject(UpdateUserUseCase);

  private readonly _users = signal<UserManagement[]>([]); // Danh sách user trang hiện tại
  private readonly _roles = signal<Role[]>([]); // Danh sách tất cả vai trò
  private readonly _totalCount = signal<number>(0); // Tổng số user hệ thống
  private readonly _pageIndex = signal<number>(1); // Trang hiện tại
  private readonly _pageSize = signal<number>(10); // Số lượng trên mỗi trang
  private readonly _totalPages = signal<number>(1); // Tổng số trang
  private readonly _searchQuery = signal<string>(''); // Từ khóa tìm kiếm
  private readonly _statusFilter = signal<'all' | 'active' | 'inactive'>('all'); // Bộ lọc trạng thái
  private readonly _isLoading = signal<boolean>(false); // Đang tải dữ liệu hay không
  private readonly _isSubmitting = signal<boolean>(false); // Đang gửi lệnh cập nhật hay không

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

  readonly stats = computed(() => {
    const list = this._users();
    return {
      total: this._totalCount(),
      activeCount: list.filter((u) => u.isActive).length,
      inactiveCount: list.filter((u) => !u.isActive).length,
    };
  });

  loadUsers = (): void => {
    this._isLoading.set(true);
    let isActiveParam: boolean | undefined = undefined;
    if (this._statusFilter() === 'active') isActiveParam = true;
    if (this._statusFilter() === 'inactive') isActiveParam = false;
    this._getUsersUseCase
      .execute({
        isActive: isActiveParam,
        pageIndex: this._pageIndex(),
        pageSize: this._pageSize(),
        search: this._searchQuery() || undefined,
      })
      .subscribe({
        next: (result) => {
          // Lưu nguyên vẹn danh sách người dùng từ BE về signal _users
          this._users.set(result.items);
          this._totalCount.set(result.totalCount);
          this._totalPages.set(result.totalPages);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._isLoading.set(false);
          this._showError(err);
        },
      });
  };

  loadRoles(): void {
    this._getRolesUseCase.execute().subscribe({
      next: (roles) => this._roles.set(roles),
      error: (err) => this._showError(err),
    });
  }

  // Đổi từ khóa tìm kiếm
  setSearch(query: string): void {
    this._searchQuery.set(query);
    this._pageIndex.set(1); // Reset về trang 1 khi tìm kiếm
    this.loadUsers();
  }

  setStatusFilter(status: 'all' | 'active' | 'inactive'): void {
    this._statusFilter.set(status);
    this._pageIndex.set(1);
    this.loadUsers();
  }

  // cập nhật số trang
  setPage(page: number): void {
    if (page < 1 || page > this._totalPages()) return;
    this._pageIndex.set(page);
    this.loadUsers();
  }

  setPageSize(size: number): void {
    this._pageSize.set(size);
    this._pageIndex.set(1);
    this.loadUsers();
  }

  updateUserStatus = (request: UpdateUserStatusRequest, onSuccess?: () => void): void => {
    this._isSubmitting.set(true);
    this._updateUserStatusUseCase.execute(request).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        // Cập nhật ngay trên mảng signal người dùng mà không cần reload cả trang
        this._users.update((list) =>
          list.map((u) => (u.id === request.userId ? { ...u, isActive: request.isActive } : u)),
        );
        toast.success(
          request.isActive ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công',
        );
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this._showError(err);
      },
    });
  };

  assignRole(userId: string, roleId: string, onSuccess?: () => void): void {
    this._isSubmitting.set(true);
    this._assignUserRoleUseCase.execute(userId, roleId).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        toast.success('Cập nhật vai trò người dùng thành công');
        this.loadUsers(); // Tải lại để lấy danh sách tên vai trò mới nhất
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this._showError(err);
      },
    });
  }

  createUser(request: CreateUserRequest, onSuccess?: () => void): void {
    this._isSubmitting.set(true);
    this._createUserUseCase.execute(request).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        toast.success('Tạo người dùng mới thành công');
        this.loadUsers(); // Tải lại danh sách
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this._showError(err);
      },
    });
  }

  deleteUser(userId: string, onSuccess?: () => void): void {
    this._isSubmitting.set(true);
    this._deleteUserUseCase.execute(userId).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        toast.success('Xóa người dùng thành công');
        this.loadUsers(); // Tải lại danh sách
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this._showError(err);
      },
    });
  }

  updateUser(userId: string, request: AdminUpdateUserRequest, onSuccess?: () => void): void {
    this._isSubmitting.set(true);
    this._updateUserUseCase.execute(userId, request).subscribe({
      next: (updatedUser) => {
        this._isSubmitting.set(false);
        this._users.update((list) =>
          list.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u)),
        );
        toast.success('Cập nhật thông tin người dùng thành công');
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this._showError(err);
      },
    });
  }

  // --- Private helper: Trích xuất và hiển thị lỗi từ API response ---
  private _showError(err: unknown): void {
    toast.error(extractApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
  }
}
