import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../../../application/layout/layout.service';
import { AuthStore } from '../../../../../application/state/auth.store';

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
    // Đảm bảo sidebar ở trạng thái mở rộng khi vào trang settings mà không ghi đè cài đặt lưu trữ
    this.layoutService.setSidebarCollapsed(false, false);
  }

  ngOnDestroy(): void {
    // Khi rời trang settings, quay lại sidebar chính và khôi phục tuỳ chọn thu gọn trước đó
    this.layoutService.setSidebar('main');
    this.layoutService.restoreSidebarPreference();
  }

  navigateBack(): void {
    this.router.navigate(['/home-page']);
  }
}
