import { Component, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserStore } from '../../../../state/user.store';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './profile-overview.component.html',
})
export class ProfileOverviewComponent {
  readonly userStore = inject(UserStore);

  /** Badge màu thống nhất cho role */
  readonly roleBadgeClass =
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
}
