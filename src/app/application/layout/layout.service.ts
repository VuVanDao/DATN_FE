import { Injectable, signal } from '@angular/core';

export type SidebarType = 'main' | 'board' | 'workspace' | 'settings' | 'admin';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'datn_sidebar_collapsed';

function getInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  /** Trạng thái thu gọn/mở rộng của Sidebar bên trái (w-60 vs w-18) */
  readonly isSidebarCollapsed = signal<boolean>(getInitialSidebarCollapsed());

  /** Loại sidebar đang hoạt động: 'main' (mặc định), 'board', 'workspace', 'settings' */
  readonly activeSidebar = signal<SidebarType>('main');

  /** Trạng thái đóng/mở của Drawer Trợ lý AI bên phải */
  readonly isAiDrawerOpen = signal<boolean>(false);

  /** Chế độ full bleed cho trang Board toàn màn hình */
  readonly isFullBleed = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((collapsed) => {
      const next = !collapsed;
      this.saveSidebarCollapsed(next);
      return next;
    });
  }

  setSidebarCollapsed(collapsed: boolean, persist: boolean = true): void {
    this.isSidebarCollapsed.set(collapsed);
    if (persist) {
      this.saveSidebarCollapsed(collapsed);
    }
  }

  restoreSidebarPreference(): void {
    this.isSidebarCollapsed.set(getInitialSidebarCollapsed());
  }

  setSidebar(type: SidebarType): void {
    this.activeSidebar.set(type);
    // Không tự động gán isSidebarCollapsed = false để giữ nguyên trạng thái đóng/mở khi người dùng điều hướng qua lại giữa các trang
  }

  setFullBleed(enabled: boolean): void {
    this.isFullBleed.set(enabled);
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

  private saveSidebarCollapsed(collapsed: boolean): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
      } catch {
        // Bỏ qua lỗi quota hoặc bảo mật localStorage
      }
    }
  }
}
