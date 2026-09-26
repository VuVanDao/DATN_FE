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
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { WorkspaceDetail, WorkspaceMember } from '../../../../../../domain/models/workspace.model';
import { AuthStore } from '../../../../../state/auth.store';
import { WorkspaceStore } from '../../../../../state/workspace.store';

@Component({
  selector: 'app-workspace-settings-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './workspace-settings-tab.component.html',
})
export class WorkspaceSettingsTabComponent implements OnChanges {
  readonly workspaceStore = inject(WorkspaceStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  @Input() workspace!: WorkspaceDetail;
  @Input() isOwner = false;
  @Output() deleteWorkspace = new EventEmitter<void>();
  @Output() leaveWorkspace = new EventEmitter<void>();

  readonly logoFile = new FormControl<File | null>(null);
  readonly coverFile = new FormControl<File | null>(null);
  readonly logoPreview = new FormControl<string | null>(null);
  readonly coverPreview = new FormControl<string | null>(null);
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
    if (changes['workspace']?.currentValue) {
      this.form.patchValue({
        name: this.workspace.name,
        description: this.workspace.description ?? '',
      });
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
    const reader = new FileReader();
    reader.onload = () =>
      type === 'logo'
        ? this.logoPreview.setValue(reader.result as string)
        : this.coverPreview.setValue(reader.result as string);
    reader.readAsDataURL(file);
    type === 'logo' ? this.logoFile.setValue(file) : this.coverFile.setValue(file);
  }

  submitUpdateForm(): void {
    if (!this.isOwner || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description } = this.form.getRawValue();
    this.workspaceStore.updateWorkspace(
      this.workspace.id,
      {
        name: name,
        description: description,
        logo: this.logoFile.value,
        coverImage: this.coverFile.value,
      },
      (updated) => {
        this.logoFile.setValue(null);
        this.coverFile.setValue(null);
        this.logoPreview.setValue(null);
        this.coverPreview.setValue(null);
        if (updated.slug !== this.workspace.slug)
          this.router.navigate(['/workspaces', updated.slug], { replaceUrl: true });
      },
    );
  }
}
