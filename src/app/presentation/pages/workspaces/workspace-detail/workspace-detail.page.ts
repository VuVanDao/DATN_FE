import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceStore } from '../../../state/workspace.store';
import { AuthStore } from '../../../state/auth.store';
import { LayoutService } from '../../../../application/layout/layout.service';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceMember } from '../../../../domain/models/workspace.model';
import { toast } from 'ngx-sonner';
import { InviteMembersModalComponent } from './components/invite-members-modal/invite-members-modal.component';
import { WorkspaceDeleteModalComponent } from './components/workspace-delete-modal/workspace-delete-modal.component';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { MemberRemovalModalComponent } from './components/member-removal-modal/member-removal-modal.component';

type WorkspaceTab = 'projects' | 'members' | 'settings';
@Component({
  selector: 'app-workspace-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    InviteMembersModalComponent,
    WorkspaceDeleteModalComponent,
    CreateProjectModalComponent,
    MemberRemovalModalComponent,
  ],
  templateUrl: './workspace-detail.page.html',
})
export class WorkspaceDetailPage implements OnInit {
  readonly workspaceStore = inject(WorkspaceStore);
  readonly authStore = inject(AuthStore);
  private readonly layoutService = inject(LayoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // tab dang mo
  readonly activeTab = signal<WorkspaceTab>('projects');
  // Quản lý file upload cho Tab Cài đặt
  readonly logoFile = signal<File | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly coverFile = signal<File | null>(null);
  readonly coverPreview = signal<string | null>(null);
  // Modal mời thành viên
  readonly showInviteModal = signal<boolean>(false);
  // Modal xác nhận xóa Workspace
  readonly showDeleteModal = signal<boolean>(false);
  // state modal create project
  readonly showCreateProjectModal = signal<boolean>(false);

  readonly selectedMemberToRemove = signal<WorkspaceMember | null>(null);

  readonly showMemberRemovalModal = signal<boolean>(false);

  readonly isSystemAdmin = computed(() => {
    const role = this.authStore.currentUser()?.Role;
    return role === 'SystemAdmin' || role === 'Admin';
  });

  readonly isSelfRemoval = computed(() => {
    const currentUserId = this.authStore.currentUser()?.Id;
    const selected = this.selectedMemberToRemove();
    return !!(currentUserId && selected && currentUserId.toString() === selected.userId.toString());
  });

  // Kiểm tra quyền WorkspaceOwner
  readonly isOwner = computed(() => {
    const currUser = this.authStore.currentUser();
    const ws = this.workspaceStore.currentWorkspace();

    if (
      ws?.currentUserRole !== 'WorkspaceOwner' ||
      ws?.ownerId.toString() !== currUser?.Id.toString()
    ) {
      return false;
    }
    return true;
  });

  //Form update
  readonly updateForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  constructor() {
    // Tự động điền dữ liệu vào form cài đặt khi thông tin Workspace được load
    effect(() => {
      const ws = this.workspaceStore.currentWorkspace();
      if (ws) {
        this.updateForm.patchValue({
          name: ws.name,
          description: ws.description ?? '',
        });
      }
    });
  }
  ngOnInit(): void {
    this.layoutService.setSidebar('main');
    // Lấy slug từ URL và tải chi tiết Workspace
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.workspaceStore.getWorkspaceDetail(slug);
      }
    });
  }
  // Lấy danh sách 4 avatar đầu tiên để hiển thị trên Header
  get displayHeaderMember(): WorkspaceMember[] {
    const members = this.workspaceStore.currentWorkspace()?.members ?? [];
    return members.slice(0, 4);
  }
  openInviteModal(): void {
    this.showInviteModal.set(true);
  }
  closeInviteModal(): void {
    this.showInviteModal.set(false);
  }
  get extraHeaderMembersCount(): number {
    const total = this.workspaceStore.currentWorkspace()?.members?.length ?? 0;
    return Math.max(0, total - 4);
  }
  formatRoleFunc(roleName?: string | null): string {
    switch (roleName) {
      case 'WorkspaceOwner':
        return 'Chủ sở hữu';
      case 'WorkspaceAdmin':
        return 'Quản trị viên';
      case 'WorkspaceMember':
        return 'Thành viên';
      case 'ProjectLeader':
        return 'Trưởng dự án';
      case 'ProjectMember':
        return 'Thành viên dự án';
      default:
        return roleName || 'Thành viên';
    }
  }
  // Định dạng ngày tham gia / hoạt động
  formatActivityDateFunc(dateStr?: string | null): string {
    if (!dateStr) return 'Đang hoạt động';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return 'Đang hoạt động';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
  onSelectLogoFunc = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP');
      input.value = '';
      return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSizeInBytes) {
      toast.error('Ảnh logo không được vượt quá 2 MB');
      input.value = '';
      return;
    }

    this.logoFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  };

  // Xử lý chọn Ảnh bìa (Cover)
  onSelectCoverFunc = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP');
      input.value = '';
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      toast.error('Ảnh bìa không được vượt quá 5 MB');
      input.value = '';
      return;
    }

    this.coverFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.coverPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    input.value = '';
  };
  saveUdpate = (): void => {
    const ws = this.workspaceStore.currentWorkspace();
    if (!ws || this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }
    const { name, description } = this.updateForm.getRawValue();
    this.workspaceStore.updateWorkspace(
      ws.id,
      {
        name: name,
        description: description,
        logo: this.logoFile(),
        coverImage: this.coverFile(),
      },
      (res) => {
        this.logoFile.set(null);
        this.logoPreview.set(null);
        this.coverFile.set(null);
        this.coverPreview.set(null);
        // Nếu slug thay đổi do đổi tên, cập nhật lại URL trên thanh địa chỉ mà không reload trang
        if (res.slug !== ws.slug) {
          this.router.navigate(['/workspaces', res.slug], { replaceUrl: true });
        }
      },
    );
  };

  openDeleteWorkspaceModal = (): void => {
    this.showDeleteModal.set(true);
  };

  closeDeleteWorkspaceModal = (): void => {
    this.showDeleteModal.set(false);
  };

  onConfirmDelete = (): void => {
    const ws = this.workspaceStore.currentWorkspace();
    if (!ws) return;
    this.workspaceStore.deleteWorkspace(ws.id, () => {
      this.closeDeleteWorkspaceModal();
      this.router.navigate(['/workspaces']);
    });
  };
  openCreateProjectModal(): void {
    this.showCreateProjectModal.set(true);
  }
  closeCreateProjectModal(): void {
    this.showCreateProjectModal.set(false);
  }

  canRemoveMember(member: WorkspaceMember): boolean {
    const ws = this.workspaceStore.currentWorkspace();
    const currUser = this.authStore.currentUser();

    if (!ws || !currUser) {
      return false;
    }

    if (member.userId.toString() === ws.ownerId.toString()) {
      return false;
    }

    if (this.isOwner() || this.isSystemAdmin()) {
      return true;
    }

    return member.userId.toString() === currUser.Id.toString();
  }

  openRemoveMemberModal(member: WorkspaceMember): void {
    this.selectedMemberToRemove.set(member);
    this.showMemberRemovalModal.set(true);
  }

  closeRemoveMemberModal(): void {
    this.showMemberRemovalModal.set(false);
    this.selectedMemberToRemove.set(null);
  }

  onMemberRemoved(event: { memberId: string; workspaceId: string } | string): void {
    const removedUserId = typeof event === 'string' ? event : event.memberId;
    const currentUserId = this.authStore.currentUser()?.Id;
    if (currentUserId && removedUserId === currentUserId.toString()) {
      this.router.navigate(['/workspaces']);
    }
  }
}
