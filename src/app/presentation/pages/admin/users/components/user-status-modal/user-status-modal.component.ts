import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserMangement } from '../../../../../../domain/models/admin.model';
import { AdminStore } from '../../../../../state/admin.store';

@Component({
  selector: 'app-user-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './user-status-modal.component.html',
})
export class UserStatusModalComponent {
  readonly store = inject(AdminStore);

  @Input() isOpen = false;
  @Input() user: UserMangement | null = null;
  @Input() targetStatus = true; // true: mở khóa, false: khóa

  @Output() closed = new EventEmitter<void>();

  readonly statusReason = signal<string>('');

  close(): void {
    this.statusReason.set('');
    this.closed.emit();
  }

  confirmStatusChange(): void {
    if (!this.user) return;

    this.store.updateUserStatus(
      {
        userId: this.user.Id,
        IsActive: this.targetStatus,
        reason: this.statusReason().trim() || undefined,
      },
      () => {
        this.close();
      },
    );
  }
}
