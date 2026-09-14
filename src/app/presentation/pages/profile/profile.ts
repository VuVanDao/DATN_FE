import { Component, inject, OnInit } from '@angular/core';
import { LayoutService } from '../../../application/layout/layout.service';
import { AuthStore } from '../../state/auth.store';
import { ProfileOverviewComponent } from './components/profile-overview/profile-overview.component';
import { ProfileDetailsComponent } from './components/profile-details/profile-details.component';
import { LoginHistoryComponent } from './components/login-history/login-history.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProfileOverviewComponent, ProfileDetailsComponent, LoginHistoryComponent],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly layoutService = inject(LayoutService);

  ngOnInit(): void {
    this.layoutService.setSidebar('settings');
    this.authStore.getCurrentUser();
  }
}
