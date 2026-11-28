import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthLeftComponent } from './components/auth-left/auth-left.component';

@Component({
  imports: [RouterOutlet, MatIconModule, AuthLeftComponent],
  selector: 'app-auth-layout',
  standalone: true,
  templateUrl: './auth.layout.html',
})
export class AuthLayout implements OnInit {
  private readonly router = inject(Router);
  readonly isRecoveryMode = signal<boolean>(false);

  ngOnInit(): void {
    this.checkRecoveryMode(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.checkRecoveryMode(e.urlAfterRedirects);
      });
  }

  private checkRecoveryMode(url: string): void {
    this.isRecoveryMode.set(url.includes('forgot-password') || url.includes('reset-password'));
  }
}
