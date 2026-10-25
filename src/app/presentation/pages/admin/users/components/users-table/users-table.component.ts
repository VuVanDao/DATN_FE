import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserManagement } from '../../../../../../domain/models/admin.model';
@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
  readonly users = input<UserManagement[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly currentUserId = input<string>();
  readonly view = output<UserManagement>();
  readonly edit = output<UserManagement>();
  readonly assignRole = output<UserManagement>();
  readonly remove = output<UserManagement>();
  readonly statusChange = output<{ user: UserManagement; active: boolean }>();
  readonly retry = output<void>();
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SystemAdmin':
      case 'Admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'User':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'WorkspaceOwner':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'ProjectOwner':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Developer':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }
}
