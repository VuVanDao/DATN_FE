import { Component, effect, EventEmitter, inject, Output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserStore } from '../../../../state/user.store';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent {
  readonly userStore = inject(UserStore);

  @Output() saved = new EventEmitter<void>();

  readonly isEditMode = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    bio: new FormControl('', { nonNullable: true }),
  });

  get usernameControl() {
    return this.form.controls.username;
  }
  get bioControl() {
    return this.form.controls.bio;
  }

  readonly roleBadgeClass =
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

  initFormData(): void {
    const user = this.userStore.currentUserData();
    if (user) {
      this.form.patchValue({
        username: user.UserName,
        bio: user.Bio ?? '',
      });
    }
  }

  enterEditMode(): void {
    this.initFormData();
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.initFormData();
    this.form.markAsPristine();
    this.isEditMode.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);

    // Giả lập lưu (sau này tích hợp API update profile)
    setTimeout(() => {
      this.isSaving.set(false);
      this.isEditMode.set(false);
      this.saved.emit();
    }, 600);
  }
}
