import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../../../../../application/layout/layout.service';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatTooltipModule, MatIconModule],
  templateUrl: './settings-sidebar.component.html',
})
export class SettingsSidebarComponent implements OnInit, OnDestroy {
  readonly layoutService = inject(LayoutService);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Đảm bảo sidebar ở trạng thái mở rộng khi vào trang settings
    this.layoutService.setSidebarCollapsed(false);
  }

  ngOnDestroy(): void {
    // Khi rời trang settings, quay lại sidebar chính
    this.layoutService.setSidebar('main');
  }

  navigateBack(): void {
    this.router.navigate(['/home-page']);
  }
}
