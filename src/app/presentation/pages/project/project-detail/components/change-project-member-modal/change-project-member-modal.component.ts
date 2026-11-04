import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectMember, ProjectRole } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-change-project-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './change-project-member-modal.component.html',
})
export class ChangeProjectMemberModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly member = input<ProjectMember | null>(null);
  readonly projectName = input<string>('');
  readonly roles = input<ProjectRole[]>([]);
  readonly isUpdating = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly closed = output<void>();
  readonly confirmed = output<{ newRoleId: string | null; jobTitle: string }>();

  readonly selectedNewRoleId = signal<string | null>(null);
  readonly selectedJobTitle = signal<string>('');

  readonly selectedRole = computed<ProjectRole | undefined>(() => {
    const roleId = this.selectedNewRoleId();
    return this.roles().find((r) => r.id === roleId);
  });

  readonly isDirty = computed<boolean>(() => {
    const m = this.member();
    if (!m) return false;
    const roleChanged = !!this.selectedNewRoleId() && this.selectedNewRoleId() !== m.roleId;
    const titleChanged = this.selectedJobTitle().trim() !== (m.jobTitle ?? '').trim();
    return roleChanged || titleChanged;
  });

  constructor() {
    effect(() => {
      const m = this.member();
      if (m) {
        this.selectedNewRoleId.set(m.roleId);
        this.selectedJobTitle.set(m.jobTitle ?? '');
      } else {
        this.selectedNewRoleId.set(null);
        this.selectedJobTitle.set('');
      }
    });
  }

  onClose(): void {
    if (this.isUpdating()) return;
    this.closed.emit();
  }

  onConfirm(): void {
    if (this.isUpdating() || !this.isDirty()) return;
    this.confirmed.emit({
      newRoleId: this.selectedNewRoleId(),
      jobTitle: this.selectedJobTitle().trim(),
    });
  }
}
