import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent {
  readonly authStore = inject(AuthStore);

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
    const user = this.authStore.currentUser();
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
    const { username, bio } = this.form.getRawValue();
    this.authStore.updateProfile(
      { Username: username, Bio: bio },
      () => {
        this.isEditMode.set(false);
        this.isSaving.set(false);
        this.form.markAsPristine();
      },
      () => {
        this.isSaving.set(false);
      },
    );
  }
}
