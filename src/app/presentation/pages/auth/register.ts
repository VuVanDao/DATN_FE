import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth.store';
import { MatIcon } from '@angular/material/icon';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) {
    return null;
  }
  // nếu match rồi thì xoá lỗi cũ
  if (password.value === confirmPassword.value) {
    if (confirmPassword.hasError('passwordMismatch')) {
      delete confirmPassword.errors?.['passwordMismatch'];
      confirmPassword.updateValueAndValidity({ onlySelf: true });
    }
    return null;
  }
  confirmPassword.setErrors({ passwordMismatch: true });
  return { passwordMismatch: true };
};
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './register.html',
})
export class RegisterPage {
  readonly authStore = inject(AuthStore);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly registerForm = new FormGroup(
    {
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator },
  );
  get usernameControl() {
    return this.registerForm.controls.username;
  }
  get emailControl() {
    return this.registerForm.controls.email;
  }
  get passwordControl() {
    return this.registerForm.controls.password;
  }
  get confirmPasswordControl() {
    return this.registerForm.controls.confirmPassword;
  }
  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }
  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { username, email, password } = this.registerForm.getRawValue();
    this.authStore.register({
      username: username,
      email: email,
      password: password,
    });
  }
}
