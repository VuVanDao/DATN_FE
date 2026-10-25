import { Component, inject, OnInit } from '@angular/core';
import { LayoutService } from '../../../application/layout/layout.service';
import { ProfileStore } from '../../../application/state/profile.store';
import { LoginHistoryComponent } from './components/login-history/login-history.component';
import { ProfileDetailsComponent } from './components/profile-details/profile-details.component';
import { ProfileOverviewComponent } from './components/profile-overview/profile-overview.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProfileOverviewComponent, ProfileDetailsComponent, LoginHistoryComponent],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements OnInit {
  readonly profileStore = inject(ProfileStore);
  readonly layoutService = inject(LayoutService);

  ngOnInit(): void {
    this.layoutService.setSidebar('settings');
    this.profileStore.getCurrentUser();
  }
}
