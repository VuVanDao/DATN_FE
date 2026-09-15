import { computed, inject, Injectable, signal } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { AdminUser, Role, UpdateUserStatusRequest } from '../../domain/models/admin.model';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root',
})
export class AdminStore {
  private readonly _adminRepository = inject(AdminRepository);

  private readonly _users = signal<AdminUser[]>([]); // Danh sách user trang hiện tại
  private readonly _roles = signal<Role[]>([]); // Danh sách tất cả vai trò
  private readonly _totalCount = signal<number>(0); // Tổng số user hệ thống
  private readonly _pageIndex = signal<number>(1); // Trang hiện tại
  private readonly _pageSize = signal<number>(10); // Số lượng trên mỗi trang
  private readonly _totalPages = signal<number>(1); // Tổng số trang
  private readonly _searchQuery = signal<string>(''); // Từ khóa tìm kiếm
  private readonly _statusFilter = signal<'all' | 'active' | 'inactive'>('all'); // Bộ lọc trạng thái
  private readonly _roleFilter = signal<string>('all'); // Bộ lọc vai trò
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
  readonly roleFilter = this._roleFilter.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();

  readonly stats = computed(() => {
    const list = this._users();
    return {
      total: this._totalCount(),
      activeCount: list.filter((u) => u.IsActive).length,
      inactiveCount: list.filter((u) => !u.IsActive).length,
      adminCount: list.filter((u) => u.Roles.includes('SystemAdmin') || u.Roles.includes('Admin'))
        .length,
    };
  });
  loadUsers = (): void => {
    this._isLoading.set(true);
    let isActiveParam: boolean | undefined = undefined;
    if (this._statusFilter() === 'active') isActiveParam = true;
    if (this._statusFilter() === 'inactive') isActiveParam = false;
    this._adminRepository
      .GetUsers({
        isActive: isActiveParam,
        pageIndex: this._pageIndex(),
        pageSize: this._pageSize(),
        search: this._searchQuery() || undefined,
      })
      .subscribe({
        next: (result) => {
          console.log('🚀 ~ AdminStore ~ result:', result);
          let items = result.items;
          if (this._roleFilter() !== 'all') {
            items = items.filter((u) => u.Roles.includes(this._roleFilter()));
          }
          this._users.set(items);
          this._totalCount.set(result.totalCount);
          this._totalPages.set(result.totalPages);
          this._isLoading.set(false);
        },
        error: (err) => {
          const errorsList = err?.error?.errors;
          let detailedMsg: string | null = null;
          if (Array.isArray(errorsList) && errorsList.length > 0) {
            detailedMsg = errorsList[0];
          } else if (typeof errorsList === 'object' && errorsList !== null) {
            const firstKey = Object.keys(errorsList)[0];
            detailedMsg = errorsList[firstKey]?.[0];
          }
          const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
          toast.error(msg);
        },
      });
  };
  loadRoles(): void {
    this._adminRepository.GetRoles().subscribe({
      next: (roles) => this._roles.set(roles),
      error: (err) => {
        const errorsList = err?.error?.errors;
        let detailedMsg: string | null = null;
        if (Array.isArray(errorsList) && errorsList.length > 0) {
          detailedMsg = errorsList[0];
        } else if (typeof errorsList === 'object' && errorsList !== null) {
          const firstKey = Object.keys(errorsList)[0];
          detailedMsg = errorsList[firstKey]?.[0];
        }
        const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
        toast.error(msg);
      },
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
  setRoleFilter(role: string): void {
    this._roleFilter.set(role);
    this._pageIndex.set(1);
    this.loadUsers();
  }
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
    this._adminRepository.UpdateUserStatus(request).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        // Cập nhật ngay trên mảng signal người dùng mà không cần reload cả trang
        this._users.update((list) =>
          list.map((u) => (u.Id === request.userId ? { ...u, IsActive: request.IsActive } : u)),
        );
        toast.success(
          request.IsActive ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công',
        );
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        const errorsList = err?.error?.errors;
        let detailedMsg: string | null = null;
        if (Array.isArray(errorsList) && errorsList.length > 0) {
          detailedMsg = errorsList[0];
        } else if (typeof errorsList === 'object' && errorsList !== null) {
          const firstKey = Object.keys(errorsList)[0];
          detailedMsg = errorsList[firstKey]?.[0];
        }
        const msg = detailedMsg || err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại';
        toast.error(msg);
      },
    });
  };
  assignRoles(userId: string, roleIds: string[], onSuccess?: () => void): void {
    this._isSubmitting.set(true);
    this._adminRepository.AssignUserRoles(userId, roleIds).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        toast.success('Cập nhật vai trò người dùng thành công');
        this.loadUsers(); // Tải lại để lấy danh sách tên vai trò mới nhất
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this._isSubmitting.set(false);
        toast.error(err?.error?.message || 'Có lỗi khi phân quyền vai trò');
      },
    });
  }
}
