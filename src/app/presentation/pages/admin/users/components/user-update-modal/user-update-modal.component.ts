import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserMangement } from '../../../../../../domain/models/admin.model';
import { AdminStore } from '../../../../../state/admin.store';

@Component({
  selector: 'app-user-update-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './user-update-modal.component.html',
})
export class UserUpdateModalComponent implements OnChanges {
  readonly store = inject(AdminStore);

  @Input() isOpen = false;
  @Input() user: UserMangement | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly updateUserForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    }),
    bio: new FormControl('', {
      nonNullable: true,
    }),
  });

  get usernameControl() {
    return this.updateUserForm.controls.username;
  }

  get bioControl() {
    return this.updateUserForm.controls.bio;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.updateUserForm.patchValue({
        username: this.user.UserName,
        bio: this.user.Bio || '',
      });
      this.updateUserForm.markAsPristine();
      this.updateUserForm.markAsUntouched();
    }
  }

  close(): void {
    this.updateUserForm.reset();
    this.closed.emit();
  }

  submit(): void {
    if (this.updateUserForm.invalid || !this.user) {
      this.updateUserForm.markAllAsTouched();
      return;
    }

    const { username, bio } = this.updateUserForm.getRawValue();

    this.store.updateUser(
      this.user.Id,
      {
        username: username.trim(),
        bio: bio.trim() || undefined,
      },
      () => this.close(),
    );
  }
}
