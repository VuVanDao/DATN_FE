import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-users-pagination',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './users-pagination.component.html',
})
export class UsersPaginationComponent {
  readonly pageIndex = input(1);
  readonly pageSize = input(10);
  readonly totalPages = input(1);
  readonly totalCount = input(0);
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();
}
