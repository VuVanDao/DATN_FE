import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStore } from '../../../../../../application/state/project.store';
import { WorkspaceStore } from '../../../../../../application/state/workspace.store';

@Component({
  selector: 'app-add-project-member-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './add-project-member-modal.component.html',
})
export class AddProjectMemberModalComponent implements OnInit {
  readonly projectStore = inject(ProjectStore);
  readonly workspaceStore = inject(WorkspaceStore);

  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();
  @Output() memberAdded = new EventEmitter<void>();

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    roleId: new FormControl('', { nonNullable: false }),
  });

  ngOnInit(): void {
    this.projectStore.loadRoles();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.projectId) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, roleId } = this.form.getRawValue();

    // Find member from workspace members if available to obtain userId
    const wsMembers = this.workspaceStore.members.items();
    const existing = wsMembers.find(
      (m) => m.email.toLowerCase() === email.trim().toLowerCase(),
    );

    const userId = existing?.userId || crypto.randomUUID();

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
        this.close();
      },
    );
  }

  close(): void {
    this.form.reset({ email: '', roleId: '' });
    this.closed.emit();
  }
}
