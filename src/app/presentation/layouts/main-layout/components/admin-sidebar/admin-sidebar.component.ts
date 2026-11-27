import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../layout.service';
import { AuthStore } from '../../../../../application/state/auth.store';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatTooltipModule, MatIconModule],
  templateUrl: './admin-sidebar.component.html',
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  readonly layoutService = inject(LayoutService);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  ngOnInit(): void {
    this.layoutService.setSidebarCollapsed(this.layoutService.isSidebarCollapsed());
  }
  ngOnDestroy(): void {
    // Khi thoát khỏi khu vực quản trị, tự động chuyển về sidebar chính
    this.layoutService.setSidebar('main');
  }
  navigateBack(): void {
    this.layoutService.setSidebar('main');
    this.router.navigate(['/home-page']);
  }
}
