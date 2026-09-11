import { Component, inject, signal, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UserStore } from '../../state/user.store';
import { LayoutService } from '../../../application/layout/layout.service';
export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const newPass = control.get('newPassword');
  const confirmPass = control.get('confirmNewPassword');
  if (!newPass || !confirmPass) return null;
  if (newPass.value === confirmPass.value) {
    if (confirmPass.hasError('passwordMismatch')) {
      delete confirmPass.errors?.['passwordMismatch'];
      confirmPass.updateValueAndValidity({ onlySelf: true });
    }
    return null;
  }
  confirmPass.setErrors({ passwordMismatch: true });
  return { passwordMismatch: true };
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class SettingsPage implements OnInit {
  readonly _userStore = inject(UserStore);
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
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmNewPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: passwordMatchValidator,
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
    this._userStore.changePassword(
      {
        CurrentPassword: currentPassword,
        NewPassword: newPassword,
        ConfirmNewPassword: confirmNewPassword,
      },
      () => {
        this.form.reset();
      },
    );
  }
  onCancel(): void {
    this._userStore.onCancel();
    this.form.reset();
  }
}
