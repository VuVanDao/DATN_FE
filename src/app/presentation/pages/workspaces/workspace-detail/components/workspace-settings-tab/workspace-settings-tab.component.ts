import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { toast } from 'ngx-sonner';
import { UpdateWorkspaceRequest } from '../../../../../../domain/models/workspace.model';
import { WorkspaceDetailView } from '../../../../../view-models/workspace.view-model';

@Component({
  selector: 'app-workspace-settings-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './workspace-settings-tab.component.html',
})
export class WorkspaceSettingsTabComponent implements OnChanges, OnDestroy {
  @Input() workspace!: WorkspaceDetailView;
  @Input() isOwner = false;
  @Input() isSaving = false;
  @Output() saveWorkspace = new EventEmitter<UpdateWorkspaceRequest>();
  @Output() deleteWorkspace = new EventEmitter<void>();
  @Output() leaveWorkspace = new EventEmitter<void>();

  private readonly readers = new Map<'logo' | 'cover', FileReader>();

  readonly logoFile = new FormControl<File | null>(null);
  readonly coverFile = new FormControl<File | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly coverPreview = signal<string | null>(null);
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['workspace'];
    if (!change?.currentValue) return;
    const previous = change.previousValue as WorkspaceDetailView | undefined;
    const current = this.workspace;
    if (
      !previous ||
      previous.id !== current.id ||
      previous.name !== current.name ||
      previous.description !== current.description ||
      previous.logoUrl !== current.logoUrl ||
      previous.coverImageUrl !== current.coverImageUrl
    ) {
      this.cancelImageReaders();
      this.form.reset({ name: current.name, description: current.description ?? '' });
      this.logoFile.setValue(null);
      this.coverFile.setValue(null);
      this.logoPreview.set(null);
      this.coverPreview.set(null);
    }
  }

  selectImage(event: Event, type: 'logo' | 'cover'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const maxSize = type === 'logo' ? 2 : 5;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Ảnh không được vượt quá ${maxSize} MB`);
      return;
    }
    this.readers.get(type)?.abort();
    const targetWorkspaceId = this.workspace.id;
    const reader = new FileReader();
    this.readers.set(type, reader);
    reader.onload = () =>
      this.readers.get(type) === reader &&
      this.workspace.id === targetWorkspaceId &&
      (type === 'logo'
        ? this.logoPreview.set(reader.result as string)
        : this.coverPreview.set(reader.result as string));
    reader.readAsDataURL(file);
    type === 'logo' ? this.logoFile.setValue(file) : this.coverFile.setValue(file);
  }

  ngOnDestroy(): void {
    this.cancelImageReaders();
  }

  private cancelImageReaders(): void {
    for (const reader of this.readers.values()) reader.abort();
    this.readers.clear();
  }

  resetSavedForm(): void {
    this.cancelImageReaders();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.logoFile.setValue(null);
    this.coverFile.setValue(null);
    this.logoPreview.set(null);
    this.coverPreview.set(null);
  }

  submitUpdateForm(): void {
    if (!this.isOwner || this.isSaving || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description } = this.form.getRawValue();
    this.saveWorkspace.emit({
      name,
      description,
      logo: this.logoFile.value,
      coverImage: this.coverFile.value,
    });
  }
}
