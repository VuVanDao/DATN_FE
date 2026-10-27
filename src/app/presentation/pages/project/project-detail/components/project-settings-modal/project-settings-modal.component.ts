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
import { WorkspaceStore } from '../../../../../../application/state/workspace.store';
import { Project, UpdateProjectRequest } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-project-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './project-settings-modal.component.html',
})
export class ProjectSettingsModalComponent implements OnChanges {
  readonly projectStore = inject(ProjectStore);
  readonly workspaceStore = inject(WorkspaceStore);
  readonly submitError = signal<string | null>(null);
  readonly confirmingDelete = signal(false); // đã mở modal xác nhận xoá chưa ?
  readonly deleteName = new FormControl('', { nonNullable: true }); // tên người dùng nhạp xác định xoá
  readonly deleteError = signal<string | null>(null); // lỗi khi xoá

  @Input() isOpen = false;
  @Input() project: Project | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Project>();
  @Output() deleted = new EventEmitter<Project>();

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
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['project']) {
      this.confirmingDelete.set(false);
      this.deleteName.reset();
      this.deleteError.set(null);
    }
    if (changes['isOpen']?.currentValue === true && this.project) {
      this.submitError.set(null);
      this.form.reset({
        name: this.project.name || '',
        projectKey: this.project.projectKey || '',
        description: this.project.description || '',
      });
    }
  }

  onSubmit(): void {
    if (this.projectStore.isSaving() || this.projectStore.isDeleting() || this.confirmingDelete())
      return;
    this.submitError.set(null);
    const { name, projectKey, description } = this.form.getRawValue();
    this.form.patchValue({ name: name.trim(), projectKey: projectKey.trim().toUpperCase() });
    if (this.form.invalid || !this.project) {
      this.form.markAllAsTouched();
      return;
    }

    const request: UpdateProjectRequest = {
      name: name.trim(),
      projectKey: projectKey.trim().toUpperCase(),
      description: description.trim() || null,
    };

    this.projectStore.updateProject(
      this.project.id,
      request,
      (updated) => {
        this.saved.emit(updated);
        this.closed.emit();
      },
      (message) => this.submitError.set(message),
    );
  }

  close(): void {
    if (this.projectStore.isSaving() || this.projectStore.isDeleting()) return;
    this.closed.emit();
  }

  startDelete(): void {
    // mở modal xác nhận xoá
    if (!this.project || this.projectStore.isSaving() || this.projectStore.isDeleting()) return;
    this.deleteName.reset();
    this.deleteError.set(null);
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    // đóng modal xác nhận xoá
    if (this.projectStore.isDeleting()) return;
    this.confirmingDelete.set(false);
    this.deleteError.set(null);
    this.deleteName.reset();
  }

  isDeleteNameMatched(): boolean {
    // kiểm tra text nhập vào có trùng tên dự ánđẻ xoá hay không
    return !!this.project && this.deleteName.value.trim() === this.project.name.trim();
  }

  confirmDelete(): void {
    // xác nhận xoá dự án
    const project = this.project;
    if (
      !project ||
      !this.confirmingDelete() ||
      !this.isDeleteNameMatched() ||
      this.projectStore.isSaving() ||
      this.projectStore.isDeleting()
    )
      return;
    this.deleteError.set(null);
    this.projectStore.deleteProject(
      project.id,
      () => this.deleted.emit(project),
      (message) => this.deleteError.set(message),
    );
  }
}
