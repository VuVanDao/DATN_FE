import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Role, UserManagement } from '../../../../../../domain/models/admin.model';
@Component({
  selector: 'app-user-role-modal',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './user-role-modal.component.html',
})
export class UserRoleModalComponent {
  readonly user = input<UserManagement | null>(null);
  readonly allRoles = input<Role[]>([]);
  readonly submitting = input(false);
  readonly closed = output<void>();
  readonly confirmed = output<string>();
  readonly selectedRoleId = signal('');
  readonly roles = computed(() => this.allRoles().filter((role) => role.scope === 'Global'));
  constructor() {
    effect(() => {
      const user = this.user();
      this.selectedRoleId.set(this.roles().find((role) => role.name === user?.role)?.id ?? '');
    });
  }
  saveRoles(): void {
    if (this.user() && this.selectedRoleId() && !this.submitting())
      this.confirmed.emit(this.selectedRoleId());
  }
}
