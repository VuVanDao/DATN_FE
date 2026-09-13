import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { isPlatformBrowser } from '@angular/common';
export const guestGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  // Nếu đang chạy trên SSR (Server NodeJS), cho qua để trình duyệt tải HTML về trước
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  // Nếu ĐÃ đăng nhập rồi -> Chặn lại và điều hướng về trang chủ '/'
  if (authStore.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }
  // Chưa đăng nhập -> Cho phép vào trang Login / Register bình thường
  return true;
};
