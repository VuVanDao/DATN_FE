import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-left',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './auth-left.component.html',
})
export class AuthLeftComponent {
  readonly isRecoveryMode = input<boolean>(false);
}
