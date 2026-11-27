import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../../../application/layout/layout.service';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { MainSidebarComponent } from './components/main-sidebar/main-sidebar.component';
import { SettingsSidebarComponent } from './components/settings-sidebar/settings-sidebar.component';

// Re-export types for backward compatibility
export * from './components/main-header/main-header.component';
export * from './components/main-sidebar/main-sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MainHeaderComponent,
    MainSidebarComponent,
    SettingsSidebarComponent,
    AdminSidebarComponent,
  ],
  templateUrl: './main.layout.html',
})
export class MainLayout {
  readonly layoutService = inject(LayoutService);
}
