import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminStore } from '../../../../../../application/state/admin.store';
import { accountPasswordValidators } from '../../../../../../shared/validators/password.validators';

@Component({
  selector: 'app-user-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './user-create-modal.component.html',
})
export class UserCreateModalComponent {
  readonly store = inject(AdminStore);

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  readonly createUserForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.required],
    }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: accountPasswordValidators,
    }),
    bio: new FormControl('', {
      nonNullable: true,
    }),
  });
  get emailControl() {
    return this.createUserForm.controls.email;
  }
  get usernameControl() {
    return this.createUserForm.controls.username;
  }
  get passwordControl() {
    return this.createUserForm.controls.password;
  }
  get bioControl() {
    return this.createUserForm.controls.bio;
  }
  readonly showPassword = signal<boolean>(false);

  close(): void {
    this.resetForm();
    this.closed.emit();
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }
    const { email, username, password, bio } = this.createUserForm.getRawValue();
    this.store.createUser(
      {
        email: email.trim(),
        username: username.trim(),
        password,
        bio: bio.trim() || undefined,
      },
      () => this.close(),
    );
  }

  private resetForm(): void {
    this.createUserForm.reset();
    this.showPassword.set(false);
  }
}
