import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceStore } from '../../../state/workspace.store';
import { LayoutService } from '../../../../application/layout/layout.service';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceMember } from '../../../../domain/models/workspace.model';

type WorkspaceTab = 'projects' | 'members' | 'settings';
@Component({
  selector: 'app-workspace-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './workspace-detail.page.html',
})
export class WorkspaceDetailPage implements OnInit {
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly layoutService = inject(LayoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // tab dng mo
  readonly activeTab = signal<WorkspaceTab>('projects');
  // Quản lý file upload cho Tab Cài đặt
  readonly logoFile = signal<File | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly coverFile = signal<File | null>(null);
  readonly coverPreview = signal<string | null>(null);

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
      case 'Developer':
        return 'Thành viên';
      case 'Observer':
        return 'Khách';
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
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.logoFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // Xử lý chọn Ảnh bìa (Cover)
  onSelectCoverFunc = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.coverFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.coverPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
}
