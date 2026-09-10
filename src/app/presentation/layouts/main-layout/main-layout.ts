import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-main-layout',
  standalone: true,
  templateUrl: './main-layout.html',
})
export class MainLayout {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  readonly isDropdownOpen = signal<boolean>(false);
  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }
  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }
  navigateToSettings(): void {
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }
  onLogOut(): void {
    this.authStore.logout();
  }
}
