import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toast } from 'ngx-sonner';
import { LayoutService } from '../../../layouts/layout.service';
import { AdminStore } from '../../../../application/state/admin.store';
import { AuthStore } from '../../../../application/state/auth.store';
import { UserManagement } from '../../../../domain/models/admin.model';
import { UserCreateModalComponent } from './components/user-create-modal/user-create-modal.component';
import { UserDeleteModalComponent } from './components/user-delete-modal/user-delete-modal.component';
import { UserDetailModalComponent } from './components/user-detail-modal/user-detail-modal.component';
import { UserRoleModalComponent } from './components/user-role-modal/user-role-modal.component';
import { UserStatusModalComponent } from './components/user-status-modal/user-status-modal.component';
import { UserUpdateModalComponent } from './components/user-update-modal/user-update-modal.component';
import { UsersFiltersComponent } from './components/users-filters/users-filters.component';
import { UsersPaginationComponent } from './components/users-pagination/users-pagination.component';
import { UsersTableComponent } from './components/users-table/users-table.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    UsersFiltersComponent,
    UsersTableComponent,
    UsersPaginationComponent,
    UserRoleModalComponent,
    UserDetailModalComponent,
    UserCreateModalComponent,
    UserDeleteModalComponent,
    UserStatusModalComponent,
    UserUpdateModalComponent,
  ],
  templateUrl: './admin-manage-users.page.html',
})
export class AdminManageUserPage implements OnInit {
  readonly store = inject(AdminStore);
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);

  readonly searchInput = signal(this.store.searchQuery());

  // State mở Modal Phân quyền
  readonly isRoleModalOpen = signal<boolean>(false);
  readonly selectedUserForRoles = signal<UserManagement | null>(null);

  // State mở Modal status
  readonly isStatusModalOpen = signal<boolean>(false);
  readonly selectedUserForStatus = signal<UserManagement | null>(null);
  readonly targetStatus = signal<boolean>(true); // true = mở khóa, false = khóa

  // State mở Modal chi tiết
  readonly isDetailModalOpen = signal<boolean>(false);
  readonly selectedUserForDetail = signal<UserManagement | null>(null);

  // State mở Modal tạo mới người dùng
  readonly isCreateModalOpen = signal<boolean>(false);

  // State mở Modal xác nhận xóa người dùng
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedUserForDelete = signal<UserManagement | null>(null);

  // State mở Modal cập nhật người dùng
  readonly isUpdateModalOpen = signal<boolean>(false);
  readonly selectedUserForUpdate = signal<UserManagement | null>(null);

  ngOnInit(): void {
    // Đảm bảo sidebar chuyển sang chế độ Admin
    this.layoutService.setSidebar('admin');
    // Tải danh sách người dùng và danh mục vai trò
    this.store.loadUsers();
    this.store.loadRoles();
  }
  // phần Input search
  onSearchChange(val: string): void {
    this.searchInput.set(val);
    this.store.setSearch(val.trim());
  }
  clearSearch(): void {
    this.searchInput.set('');
    this.store.setSearch('');
  }
  // lọc theo trạng thái
  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.store.setStatusFilter(status);
  }
  // set role cho các tài khoản
  openRoleModal(user: UserManagement): void {
    this.selectedUserForRoles.set(user);
    this.isRoleModalOpen.set(true);
  }
  closeRoleModal(): void {
    this.isRoleModalOpen.set(false);
    this.selectedUserForRoles.set(null);
  }
  saveRoles(roleId: string): void {
    const user = this.selectedUserForRoles();
    if (user)
      this.store.assignRole(user.id, roleId, () => {
        if (this.selectedUserForRoles()?.id === user.id) this.closeRoleModal();
      });
  }
  // update user'status
  openStatusModal(user: UserManagement, newStatus: boolean): void {
    // Kiểm tra an toàn: Không cho Admin tự khóa chính mình
    if (this.authStore.currentUser()?.id === user.id && !newStatus) {
      toast.error('Bạn không thể tự khóa tài khoản Quản trị viên của chính mình!');
      return;
    }
    this.selectedUserForStatus.set(user);
    this.targetStatus.set(newStatus);
    this.isStatusModalOpen.set(true);
  }
  closeStatusModal(): void {
    this.isStatusModalOpen.set(false);
    this.selectedUserForStatus.set(null);
  }
  // Modal chi tiết
  openDetailModal(user: UserManagement): void {
    this.selectedUserForDetail.set(user);
    this.isDetailModalOpen.set(true);
  }
  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedUserForDetail.set(null);
  }
  // Modal tạo mới người dùng
  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }
  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }
  // Modal xác nhận xóa người dùng
  openDeleteModal(user: UserManagement): void {
    // Kiểm tra an toàn: Không cho Admin tự xóa chính mình
    if (this.authStore.currentUser()?.id === user.id) {
      toast.error('Bạn không thể tự xóa tài khoản Quản trị viên của chính mình!');
      return;
    }
    this.selectedUserForDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }
  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedUserForDelete.set(null);
  }
  // Modal cập nhật người dùng
  openUpdateModal(user: UserManagement): void {
    this.selectedUserForUpdate.set(user);
    this.isUpdateModalOpen.set(true);
  }
  closeUpdateModal(): void {
    this.isUpdateModalOpen.set(false);
    this.selectedUserForUpdate.set(null);
  }
}
