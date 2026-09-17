import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LayoutService } from '../../../../application/layout/layout.service';
import { AuthStore } from '../../../state/auth.store';
import { AdminStore } from '../../../state/admin.store';
import { UserMangement } from '../../../../domain/models/admin.model';
import { toast } from 'ngx-sonner';
import { UserDetailModalComponent } from './components/user-detail-modal/user-detail-modal.component';
import { UserCreateModalComponent } from './components/user-create-modal/user-create-modal.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    UserDetailModalComponent,
    UserCreateModalComponent,
  ],
  templateUrl: './admin-manage-users.page.html',
})
export class AdminManageUserPage implements OnInit {
  readonly store = inject(AdminStore);
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);

  readonly searchInput = signal<string>('');

  // State mở Modal Phân quyền
  readonly isRoleModalOpen = signal<boolean>(false);
  readonly selectedUserForRoles = signal<UserMangement | null>(null);
  readonly selectedRoleId = signal<string>('');

  // Chỉ lấy danh sách Role toàn cục (Scope = Global) áp dụng cho tài khoản người dùng
  readonly globalRoles = computed(() => {
    return this.store.roles().filter((r) => r.Scope === 'Global');
  });

  // State mở Modal status
  readonly isStatusModalOpen = signal<boolean>(false);
  readonly selectedUserForStatus = signal<UserMangement | null>(null);
  readonly targetStatus = signal<boolean>(true); // true = mở khóa, false = khóa
  readonly statusReason = signal<string>('');

  // State mở Modal chi tiết
  readonly isDetailModalOpen = signal<boolean>(false);
  readonly selectedUserForDetail = signal<UserMangement | null>(null);

  // State mở Modal tạo mới người dùng
  readonly isCreateModalOpen = signal<boolean>(false);

  // State mở Modal xác nhận xóa người dùng
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly selectedUserForDelete = signal<UserMangement | null>(null);

  ngOnInit(): void {
    // Đảm bảo sidebar chuyển sang chế độ Admin
    this.layoutService.setSidebar('admin');
    // Tải danh sách người dùng và danh mục vai trò
    this.store.loadUsers();
    this.store.loadRoles();
  }
  onSearchChange(val: string): void {
    this.searchInput.set(val);
    this.store.setSearch(val.trim());
  }
  clearSearch(): void {
    this.searchInput.set('');
    this.store.setSearch('');
  }
  onStatusFilterChange(status: 'all' | 'active' | 'inactive'): void {
    this.store.setStatusFilter(status);
  }
  onRoleFilterChange(role: string): void {
    this.store.setRoleFilter(role);
  }
  openRoleModal(user: UserMangement): void {
    this.selectedUserForRoles.set(user);
    // Lấy ID Role hiện tại của User
    const allRoles = this.store.roles();
    const currentRole = allRoles.find((r) => r.Name === user.Role);
    this.selectedRoleId.set(currentRole ? currentRole.Id : '');
    this.isRoleModalOpen.set(true);
  }
  closeRoleModal(): void {
    this.isRoleModalOpen.set(false);
    this.selectedUserForRoles.set(null);
    this.selectedRoleId.set('');
  }
  selectRole(roleId: string): void {
    this.selectedRoleId.set(roleId);
  }
  saveRoles(): void {
    const user = this.selectedUserForRoles();
    if (!user) return;
    if (!this.selectedRoleId()) {
      toast.error('Vui lòng chọn vai trò cho người dùng!');
      return;
    }
    this.store.assignRole(user.Id, this.selectedRoleId(), () => {
      this.closeRoleModal();
    });
  }
  // update user'status
  openStatusModal(user: UserMangement, newStatus: boolean): void {
    // Kiểm tra an toàn: Không cho Admin tự khóa chính mình
    if (this.authStore.currentUser()?.Id === user.Id && !newStatus) {
      toast.error('Bạn không thể tự khóa tài khoản Quản trị viên của chính mình!');
      return;
    }
    this.selectedUserForStatus.set(user);
    this.targetStatus.set(newStatus);
    this.statusReason.set('');
    this.isStatusModalOpen.set(true);
  }
  closeStatusModal(): void {
    this.isStatusModalOpen.set(false);
    this.selectedUserForStatus.set(null);
    this.statusReason.set('');
  }
  confirmStatusChange(): void {
    const user = this.selectedUserForStatus();
    if (!user) return;
    this.store.updateUserStatus(
      {
        userId: user.Id,
        IsActive: this.targetStatus(),
        reason: this.statusReason(),
      },
      () => {
        this.closeStatusModal();
      },
    );
  }
  // Modal chi tiết
  openDetailModal(user: UserMangement): void {
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
  openDeleteModal(user: UserMangement): void {
    // Kiểm tra an toàn: Không cho Admin tự xóa chính mình
    if (this.authStore.currentUser()?.Id === user.Id) {
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
  confirmDelete(): void {
    const user = this.selectedUserForDelete();
    if (!user) return;
    this.store.deleteUser(user.Id, () => {
      this.closeDeleteModal();
    });
  }
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SystemAdmin':
      case 'Admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'User':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'WorkspaceOwner':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'ProjectOwner':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Developer':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }
}
