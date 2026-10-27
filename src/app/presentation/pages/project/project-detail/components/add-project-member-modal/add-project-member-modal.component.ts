import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { ProjectMemberPickerStore } from '../../../../../../application/project/project-member-picker.store';

@Component({
  selector: 'app-add-project-member-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  providers: [ProjectMemberPickerStore],
  templateUrl: './add-project-member-modal.component.html',
})
export class AddProjectMemberModalComponent implements OnChanges {
  readonly projectStore = inject(ProjectStore);
  readonly candidates = inject(ProjectMemberPickerStore).members;
  readonly submitError = signal<string | null>(null);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() memberAdded = new EventEmitter<void>();

  readonly form = new FormGroup({
    userId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    roleId: new FormControl('', { nonNullable: false }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['workspaceId'] || changes['projectId']) {
      this.candidates.clear();
      this.form.reset({ userId: '', roleId: '' });
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

  isLeaderSelected(): boolean {
    return this.projectStore
      .roles()
      .some((role) => role.id === this.form.controls.roleId.value && role.name === 'ProjectLeader');
  }

  onSubmit(): void {
    if (
      this.projectStore.isAddingMember() ||
      this.projectStore.isLoadingRoles() ||
      this.projectStore.rolesError()
    )
      return;
    this.submitError.set(null);
    if (this.form.invalid || !this.projectId || !this.workspaceId) {
      this.form.markAllAsTouched();
      return;
    }

    const { userId, roleId } = this.form.getRawValue();
    if (!this.candidates.items().some((member) => member.userId === userId)) {
      this.submitError.set('Vui lòng chọn một thành viên trong workspace.');
      return;
    }
    if (this.isProjectMember(userId)) {
      this.submitError.set('Thành viên này đã có trong dự án.');
      return;
    }
    if (roleId && !this.projectStore.roles().some((role) => role.id === roleId)) {
      this.submitError.set('Vai trò không hợp lệ. Vui lòng chọn lại.');
      return;
    }

    this.projectStore.addMembers(
      this.projectId,
      {
        members: [
          {
            userId,
            roleId: roleId || null,
          },
        ],
      },
      () => {
        this.memberAdded.emit();
        this.form.reset({ userId: '', roleId: '' });
        this.closed.emit();
      },
      (message) => this.submitError.set(message),
    );
  }

  close(): void {
    if (this.projectStore.isAddingMember()) return;
    this.candidates.clear();
    this.submitError.set(null);
    this.form.reset({ userId: '', roleId: '' });
    this.closed.emit();
  }
}
