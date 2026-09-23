import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProfileStore } from '../../../../state/profile.store';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePipe, MatIconModule],
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent {
  readonly profileStore = inject(ProfileStore);

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

  initFormData(): void {
    const user = this.profileStore.currentUser();
    if (user) {
      this.form.patchValue({
        username: user.userName,
        bio: user.bio ?? '',
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
    this.profileStore.updateProfile(
      { username: username, bio: bio },
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
