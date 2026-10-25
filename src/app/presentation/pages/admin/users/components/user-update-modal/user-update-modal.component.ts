import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminStore } from '../../../../../../application/state/admin.store';
import { UserManagement } from '../../../../../../domain/models/admin.model';

@Component({
  selector: 'app-user-update-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './user-update-modal.component.html',
})
export class UserUpdateModalComponent implements OnChanges {
  readonly store = inject(AdminStore);

  @Input() isOpen = false;
  @Input() user: UserManagement | null = null;
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
    if ((changes['user'] || changes['isOpen']?.currentValue === true) && this.user) {
      this.updateUserForm.patchValue({
        username: this.user.userName,
        bio: this.user.bio || '',
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
    if (this.updateUserForm.invalid || !this.user || !this.isOpen || this.store.isSubmitting()) {
      this.updateUserForm.markAllAsTouched();
      return;
    }

    const userId = this.user.id;
    const { username, bio } = this.updateUserForm.getRawValue();

    this.store.updateUser(
      userId,
      {
        username: username.trim(),
        bio: bio.trim() || undefined,
      },
      () => {
        if (this.isOpen && this.user?.id === userId) this.close();
      },
    );
  }
}
