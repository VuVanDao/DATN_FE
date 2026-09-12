import { Component, inject, OnInit, signal } from '@angular/core';
import { LayoutService } from '../../../application/layout/layout.service';
import { UserStore } from '../../state/user.store';
import { ProfileOverviewComponent } from './components/profile-overview/profile-overview.component';
import { ProfileDetailsComponent } from './components/profile-details/profile-details.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProfileOverviewComponent, ProfileDetailsComponent],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  readonly userStore = inject(UserStore);
  readonly layoutService = inject(LayoutService);

  ngOnInit(): void {
    this.layoutService.setSidebar('settings');
    this.userStore.getCurrentUser();
  }
}
