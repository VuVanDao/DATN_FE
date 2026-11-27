import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../../layouts/layout.service';
import { ProfileStore } from '../../../application/state/profile.store';
import {
  matchingPasswords,
  newPasswordValidators,
} from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './change-password.page.html',
})
export class ChangePasswordPage implements OnInit {
  readonly profileStore = inject(ProfileStore);
  readonly layoutService = inject(LayoutService);

  readonly showCurrent = signal<boolean>(false);
  readonly showNew = signal<boolean>(false);
  readonly showConfirm = signal<boolean>(false);

  ngOnInit(): void {
    this.layoutService.setSidebar('settings');
  }

  readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: newPasswordValidators,
      }),
      confirmNewPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: matchingPasswords('newPassword', 'confirmNewPassword'),
    },
  );

  get currentPasswordControl() {
    return this.form.controls.currentPassword;
  }
  get newPasswordControl() {
    return this.form.controls.newPassword;
  }
  get confirmNewPasswordControl() {
    return this.form.controls.confirmNewPassword;
  }

  toggleShowCurrent(): void {
    this.showCurrent.update((v) => !v);
  }
  toggleShowNew(): void {
    this.showNew.update((v) => !v);
  }
  toggleShowConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmNewPassword } = this.form.getRawValue();
    this.profileStore.changePassword(
      {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmNewPassword: confirmNewPassword,
      },
      () => {
        this.form.reset();
      },
    );
  }

  onCancel(): void {
    this.form.reset();
  }
}
