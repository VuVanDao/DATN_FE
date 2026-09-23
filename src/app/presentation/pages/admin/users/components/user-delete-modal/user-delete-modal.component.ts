import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserManagement } from '../../../../../../domain/models/admin.model';
import { AdminStore } from '../../../../../state/admin.store';

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
    if (!this.user) return;
    this.store.deleteUser(this.user.Id, () => {
      this.deleted.emit(this.user!);
      this.close();
    });
  }
}
