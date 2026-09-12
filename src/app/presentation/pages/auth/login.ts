import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../state/auth.store';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIcon],
  templateUrl: './login.html',
})
export class LoginPage {
  readonly authStore = inject(AuthStore);
  readonly showPassword = signal<boolean>(false);
  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });
  get EmailControl() {
    return this.loginForm.controls.email;
  }
  get PasswordControl() {
    return this.loginForm.controls.password;
  }
  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.authStore.login({ Email: email, Password: password });
  }
}
