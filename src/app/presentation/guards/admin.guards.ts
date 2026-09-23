import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { isPlatformBrowser } from '@angular/common';
import { toast } from 'ngx-sonner';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  // Nếu đang render phía SSR (server Node.js), cho qua để client tải về giải mã sau
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Lấy thông tin user hiện tại từ AuthStore
  const user = authStore.currentUser();
  const isAdmin = user?.role === 'SystemAdmin' || user?.role === 'Admin';
  if (isAdmin) {
    return true; // Cho phép truy cập
  }
  toast.error('Bạn không có quyền truy cập vào trang Quản trị hệ thống!');
  return router.createUrlTree(['/home-page']);
};
