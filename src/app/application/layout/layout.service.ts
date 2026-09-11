import { Injectable, signal } from '@angular/core';

export type SidebarType = 'main' | 'board' | 'workspace' | 'settings';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  /** Trạng thái thu gọn/mở rộng của Sidebar bên trái (w-60 vs w-18) */
  readonly isSidebarCollapsed = signal<boolean>(false);

  /** Loại sidebar đang hoạt động: 'main' (mặc định), 'board', 'workspace', 'settings' */
  readonly activeSidebar = signal<SidebarType>('main');

  /** Trạng thái đóng/mở của Drawer Trợ lý AI bên phải */
  readonly isAiDrawerOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }

  setSidebar(type: SidebarType): void {
    this.activeSidebar.set(type);
  }

  toggleAiDrawer(): void {
    this.isAiDrawerOpen.update((open) => !open);
  }

  openAiDrawer(): void {
    this.isAiDrawerOpen.set(true);
  }

  closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }
}
