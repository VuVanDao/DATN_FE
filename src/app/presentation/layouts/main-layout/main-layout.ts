import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-main-layout',
  standalone: true,
  templateUrl: './main-layout.html',
})
export class MainLayout {
  readonly authStore = inject(AuthStore);
  onLogOut(): void {
    this.authStore.logout();
  }
}
