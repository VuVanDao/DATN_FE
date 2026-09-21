import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WorkspaceStore } from '../../../../../state/workspace.store';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './create-project-modal.component.html',
})
export class CreateProjectModalComponent implements OnChanges {
  readonly workspaceStore = inject(WorkspaceStore);
  @Input() isOpen = false;
  @Input() workspaceId = '';
  @Output() closed = new EventEmitter<void>();

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    }),
    projectKey: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(10),
        Validators.pattern('^[a-zA-Z0-9]+$'),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    isAssignAsLeader: new FormControl(true, { nonNullable: true }),
  });
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.form.reset({
        name: '',
        projectKey: '',
        description: '',
        isAssignAsLeader: true,
      });
    }
  }
  // Tự động gợi ý ProjectKey từ Tên dự án (Ví dụ: "Hệ Thống Bán Hàng" -> "HTBH")
  onNameChange(): void {
    const currentKey = this.form.controls.projectKey.value;
    if (!currentKey || this.form.controls.projectKey.pristine) {
      const name = this.form.controls.name.value.trim();
      if (name) {
        const words = name.split(/\s+/);
        let key = '';
        if (words.length === 1) {
          key = words[0].slice(0, 4).toUpperCase();
        } else {
          key = words
            .map((w) => w[0])
            .join('')
            .slice(0, 6)
            .toUpperCase();
        }
        this.form.controls.projectKey.setValue(key.replace(/[^a-zA-Z0-9]/g, ''));
      }
    }
  }
  onSubmit(): void {
    if (this.form.invalid || !this.workspaceId) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, projectKey, description, isAssignAsLeader } = this.form.getRawValue();
    this.workspaceStore.createProject(
      {
        name: name.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        description: description ? description.trim() : null,
        isAssignAsLeader,
        workspaceId: this.workspaceId,
      },
      () => {
        this.close();
      },
    );
  }
  close(): void {
    this.closed.emit();
  }
}
