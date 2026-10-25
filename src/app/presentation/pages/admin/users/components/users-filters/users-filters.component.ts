import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserStatusFilter } from '../../../../../../application/state/admin.store';
@Component({
  selector: 'app-users-filters',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './users-filters.component.html',
})
export class UsersFiltersComponent {
  readonly query = input('');
  readonly status = input<UserStatusFilter>('all');
  readonly queryChange = output<string>();
  readonly statusChange = output<UserStatusFilter>();
}
