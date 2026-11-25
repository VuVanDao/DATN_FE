import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AdminStore } from '../../../../../../application/state/admin.store';
import { UserManagement } from '../../../../../../domain/models/admin.model';

@Component({
  selector: 'app-user-delete-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './user-delete-modal.component.html',
})
export class UserDeleteModalComponent {
  readonly store = inject(AdminStore);

  @Input() isOpen = false;
  @Input() user: UserManagement | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<UserManagement>();

  close(): void {
    this.closed.emit();
  }

  confirmDelete(): void {
    if (!this.user || !this.isOpen || this.store.isSubmitting()) return;
    const user = this.user;
    this.store.deleteUser(user.id, () => {
      if (!this.isOpen || this.user?.id !== user.id) return;
      this.deleted.emit(user);
      this.close();
    });
  }
}
