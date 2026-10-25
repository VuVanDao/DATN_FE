import { WorkspaceTabState } from '../../../../../../application/state/workspace/workspace-content.slice';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceDetail, WorkspaceMember } from '../../../../../../domain/models/workspace.model';

@Component({
  selector: 'app-workspace-members-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './workspace-members-tab.component.html',
})
export class WorkspaceMembersTabComponent {
  @Input() state!: WorkspaceTabState<WorkspaceMember>;
  @Output() retry = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();
  @Input() workspace!: WorkspaceDetail;
  @Input() isOwner = false;
  @Output() removeMember = new EventEmitter<WorkspaceMember>();

  formatRole(role?: string | null): string {
    return (
      (
        {
          WorkspaceOwner: 'Chủ sở hữu',
          WorkspaceAdmin: 'Quản trị viên',
          WorkspaceMember: 'Thành viên',
          ProjectLeader: 'Trưởng dự án',
          ProjectMember: 'Thành viên dự án',
        } as Record<string, string>
      )[role ?? ''] ??
      role ??
      'Thành viên'
    );
  }

  formatActivityDate(dateString?: string | null): string {
    if (!dateString) return 'Đang hoạt động';
    const date = new Date(dateString);
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days === 0) return 'Đang hoạt động';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }

  canRemove(member: WorkspaceMember): boolean {
    return this.isOwner && member.userId.toLowerCase() !== this.workspace.ownerId.toLowerCase();
  }
  openModalRemoveMember(member: WorkspaceMember): void {
    this.removeMember.emit(member);
  }
}
