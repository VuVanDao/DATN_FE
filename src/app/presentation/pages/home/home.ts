import { Component, inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
})
export class HomePage {
  readonly authStore = inject(AuthStore);
}
