import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminStore } from '../../../../../state/admin.store';

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
  readonly isSubmitting = signal<boolean>(false);

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
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/),
      ],
    }),
    bio: new FormControl('', {
      nonNullable: true,
    }),
  });
  get EmailControl() {
    return this.createUserForm.controls.email;
  }
  get UsernameControl() {
    return this.createUserForm.controls.username;
  }
  get PasswordControl() {
    return this.createUserForm.controls.password;
  }
  get BioControl() {
    return this.createUserForm.controls.bio;
  }
  readonly showPassword = signal<boolean>(false);

  // Validation errors (hiển thị sau khi submit lần đầu)
  readonly submitted = signal<boolean>(false);

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
    this.submitted.set(true);
    const { email, username, password, bio } = this.createUserForm.getRawValue();
    this.store.createUser(
      {
        email: email.trim(),
        username: username.trim(),
        password: password.trim(),
        bio: bio.trim() || undefined,
      },
      () => this.close(),
    );
  }

  private resetForm(): void {
    this.createUserForm.reset();
    this.showPassword.set(false);
    this.submitted.set(false);
  }
}
