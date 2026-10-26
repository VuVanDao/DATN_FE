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
import { ProjectStore } from '../../../../../../application/state/project.store';
import { Project, UpdateProjectRequest } from '../../../../../../domain/models/project.model';

@Component({
  selector: 'app-project-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './project-settings-modal.component.html',
})
export class ProjectSettingsModalComponent implements OnChanges {
  readonly projectStore = inject(ProjectStore);

  @Input() isOpen = false;
  @Input() project: Project | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<UpdateProjectRequest>();

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
    if (changes['isOpen']?.currentValue === true && this.project) {
      this.form.reset({
        name: this.project.name || '',
        projectKey: this.project.projectKey || '',
        description: this.project.description || '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.project) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, projectKey, description } = this.form.getRawValue();
    const request: UpdateProjectRequest = {
      name: name.trim(),
      projectKey: projectKey.trim().toUpperCase(),
      description: description ? description.trim() : null,
    };

    this.projectStore.updateProject(this.project.id, request, () => {
      this.saved.emit(request);
      this.close();
    });
  }

  close(): void {
    this.closed.emit();
  }
}
