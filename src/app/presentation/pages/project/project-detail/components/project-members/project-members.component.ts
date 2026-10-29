import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectMember } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './project-members.component.html',
})
export class ProjectMembersComponent {
  readonly members = input<ProjectMember[]>([]);
  readonly totalCount = input<number>(0);
  readonly canManageRoles = input<boolean>(false);
  readonly isCurrentLeader = input<boolean>(false);
  readonly isWorkspaceOwner = input<boolean>(false);
  readonly currentUserId = input<string | null | undefined>(null);
  readonly isBusy = input<boolean>(false);
  readonly canRemoveMemberFn = input<((member: ProjectMember) => boolean) | undefined>(undefined);
  readonly canChangeRoleFn = input<((member: ProjectMember) => boolean) | undefined>(undefined);

  readonly addMember = output<void>();
  readonly changeRole = output<ProjectMember>();
  readonly removeMember = output<ProjectMember>();

  readonly memberSearch = signal('');

  readonly filteredMembers = computed(() => {
    const list = this.members();
    const query = this.memberSearch().trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (m) => m.username.toLowerCase().includes(query) || m.email.toLowerCase().includes(query),
    );
  });

  isSelf(member: ProjectMember): boolean {
    const userId = this.currentUserId();
    return !!userId && member.userId.toLowerCase() === userId.toLowerCase();
  }

  canRemove(member: ProjectMember): boolean {
    const fn = this.canRemoveMemberFn();
    if (fn) {
      return fn(member);
    }
    if (member.roleName === 'ProjectLeader') return false;
    return this.isWorkspaceOwner() || this.isCurrentLeader() || this.isSelf(member);
  }

  canChange(member: ProjectMember): boolean {
    const fn = this.canChangeRoleFn();
    if (fn) {
      return fn(member);
    }
    if (!this.canManageRoles()) return false;
    if (this.isSelf(member) && member.roleName === 'ProjectLeader') return false;
    return true;
  }
}
