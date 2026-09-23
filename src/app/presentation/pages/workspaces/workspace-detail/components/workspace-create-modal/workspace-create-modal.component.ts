import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceStore } from '../../../../../state/workspace.store';
import { Workspace } from '../../../../../../domain/models/workspace.model';

@Component({
  selector: 'app-workspace-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './workspace-create-modal.component.html',
})
export class WorkspaceCreateModalComponent {
  readonly workspaceStore = inject(WorkspaceStore);

  @Input() isOpen = false;

  @Output() closed = new EventEmitter<void>();

  @Output() created = new EventEmitter<Workspace>();

  readonly createForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  get nameControl() {
    return this.createForm.controls.name;
  }

  get descriptionControl() {
    return this.createForm.controls.description;
  }

  get previewInitial(): string {
    const val = this.nameControl.value.trim();
    return val.length > 0 ? val.charAt(0).toUpperCase() : 'W';
  }

  close(): void {
    this.createForm.reset();
    this.closed.emit();
  }

  submit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { name, description } = this.createForm.getRawValue();

    this.workspaceStore.createWorkspace(
      {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      },
      (newWorkspace) => {
        this.close();
        this.created.emit(newWorkspace);
      },
    );
  }
}
