import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../application/state/auth.store';
import {
  accountPasswordValidators,
  matchingPasswords,
} from '../../../../shared/validators/password.validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './register.page.html',
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
        validators: accountPasswordValidators,
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchingPasswords('password', 'confirmPassword') },
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
