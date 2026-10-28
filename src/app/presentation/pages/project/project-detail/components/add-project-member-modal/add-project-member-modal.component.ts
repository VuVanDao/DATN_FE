import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { ProjectMemberPickerStore } from '../../../../../../application/project/project-member-picker.store';

interface SelectedMember {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  roleId: string; // '' = mặc định (backend gán ProjectMember)
}

@Component({
  selector: 'app-add-project-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  providers: [ProjectMemberPickerStore],
  templateUrl: './add-project-member-modal.component.html',
})
export class AddProjectMemberModalComponent implements OnChanges {
  readonly projectStore = inject(ProjectStore);
  readonly candidates = inject(ProjectMemberPickerStore).members;
  readonly submitError = signal<string | null>(null);
  readonly selectedMembers = signal<SelectedMember[]>([]);
  readonly touched = signal(false);

  /** RoleId mặc định (ProjectMember) */
  readonly defaultRoleId = computed(() => {
    return this.projectStore.roles().find((r) => r.name === 'ProjectMember')?.id ?? '';
  });

  /** userId của member đang được gán ProjectLeader (null nếu chưa có) */
  readonly leaderAssignedUserId = computed(() => {
    const leaderRole = this.projectStore.roles().find((r) => r.name === 'ProjectLeader');
    if (!leaderRole) return null;
    return this.selectedMembers().find((m) => m.roleId === leaderRole.id)?.userId ?? null;
  });

  /** Đã có member nào được gán ProjectLeader chưa */
  readonly hasLeaderAssigned = computed(() => this.leaderAssignedUserId() !== null);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() memberAdded = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['workspaceId'] || changes['projectId']) {
      this.candidates.clear();
      this.selectedMembers.set([]);
      this.touched.set(false);
      this.submitError.set(null);
      if (this.isOpen && this.workspaceId && this.projectId) {
        this.loadCandidates();
        this.projectStore.loadRoles();
      }
    }
  }

  loadCandidates(more = false): void {
    if (this.workspaceId) this.candidates.load(this.workspaceId, more);
  }

  isProjectMember(userId: string): boolean {
    return this.projectStore.members().some((member) => member.userId === userId);
  }

  isSelected(userId: string): boolean {
    return this.selectedMembers().some((m) => m.userId === userId);
  }

  toggleMember(member: {
    userId: string;
    username: string;
    email: string;
    avatarUrl?: string | null;
  }): void {
    if (this.projectStore.isAddingMember() || this.isProjectMember(member.userId)) return;
    this.touched.set(true);
    this.submitError.set(null);

    if (this.isSelected(member.userId)) {
      this.selectedMembers.update((list) => list.filter((m) => m.userId !== member.userId));
    } else {
      this.selectedMembers.update((list) => [
        ...list,
        {
          userId: member.userId,
          username: member.username,
          email: member.email,
          avatarUrl: member.avatarUrl,
          roleId: this.defaultRoleId(),
        },
      ]);
    }
  }

  removeMember(userId: string): void {
    if (this.projectStore.isAddingMember()) return;
    this.selectedMembers.update((list) => list.filter((m) => m.userId !== userId));
    this.submitError.set(null);
  }

  updateRole(userId: string, roleId: string): void {
    this.selectedMembers.update((list) =>
      list.map((m) => (m.userId === userId ? { ...m, roleId } : m)),
    );
    this.submitError.set(null);
  }

  isLeaderRole(roleId: string): boolean {
    return this.projectStore.roles().some((r) => r.id === roleId && r.name === 'ProjectLeader');
  }

  onSubmit(): void {
    if (
      this.projectStore.isAddingMember() ||
      this.projectStore.isLoadingRoles() ||
      this.projectStore.rolesError()
    )
      return;
    this.submitError.set(null);
    this.touched.set(true);

    const selected = this.selectedMembers();
    if (selected.length === 0 || !this.projectId || !this.workspaceId) {
      return;
    }

    // Validate: tất cả member đã chọn phải có trong workspace
    if (selected.some((m) => !this.candidates.items().some((c) => c.userId === m.userId))) {
      this.submitError.set('Vui lòng chọn các thành viên trong workspace.');
      return;
    }

    // Validate: không có member nào đã tham gia dự án
    if (selected.some((m) => this.isProjectMember(m.userId))) {
      this.submitError.set('Danh sách đã chọn có thành viên đã tham gia dự án.');
      return;
    }

    // Validate: roleId hợp lệ (nếu có)
    const roles = this.projectStore.roles();
    if (selected.some((m) => m.roleId && !roles.some((r) => r.id === m.roleId))) {
      this.submitError.set('Một hoặc nhiều vai trò không hợp lệ. Vui lòng chọn lại.');
      return;
    }

    // Validate: tối đa 1 ProjectLeader
    const leaderCount = selected.filter((m) => this.isLeaderRole(m.roleId)).length;
    if (leaderCount > 1) {
      this.submitError.set('Chỉ được gán vai trò ProjectLeader cho một thành viên.');
      return;
    }

    this.projectStore.addMembers(
      this.projectId,
      {
        members: selected.map((m) => ({ userId: m.userId, roleId: m.roleId || null })),
      },
      () => {
        this.memberAdded.emit();
        this.selectedMembers.set([]);
        this.touched.set(false);
        this.closed.emit();
      },
      (message) => this.submitError.set(message),
    );
  }

  close(): void {
    if (this.projectStore.isAddingMember()) return;
    this.candidates.clear();
    this.submitError.set(null);
    this.selectedMembers.set([]);
    this.touched.set(false);
    this.closed.emit();
  }
}
