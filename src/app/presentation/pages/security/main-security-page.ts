import { Component, inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'main-security-page',
  standalone: true,
  templateUrl: './main-security-page.html',
})
export class MainSecurityPage {
  readonly authStore = inject(AuthStore);
}
