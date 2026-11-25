import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminStore } from '../../../../../../application/state/admin.store';
import { UserManagement } from '../../../../../../domain/models/admin.model';

@Component({
  selector: 'app-user-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './user-status-modal.component.html',
})
export class UserStatusModalComponent {
  readonly store = inject(AdminStore);

  @Input() isOpen = false;
  @Input() user: UserManagement | null = null;
  @Input() targetStatus = true; // true: mở khóa, false: khóa

  @Output() closed = new EventEmitter<void>();

  readonly statusReason = signal<string>('');

  close(): void {
    this.statusReason.set('');
    this.closed.emit();
  }

  confirmStatusChange(): void {
    if (!this.user || !this.isOpen || this.store.isSubmitting()) return;
    const userId = this.user.id;

    this.store.updateUserStatus(
      {
        userId,
        isActive: this.targetStatus,
        reason: this.statusReason().trim() || undefined,
      },
      () => {
        if (this.isOpen && this.user?.id === userId) this.close();
      },
    );
  }
}
