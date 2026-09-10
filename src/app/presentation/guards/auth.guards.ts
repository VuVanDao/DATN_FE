import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // nếu đang chạy trên nodeJS
  // Server không có localStorage, nên tạm thời cho qua để trình duyệt tải về trước!
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // khi đã xuống trình duyệt
  // Lúc này mới đọc localStorage để kiểm tra đăng nhập thật sự
  if (authStore.isAuthenticated()) {
    return true;
  }
  // Chưa đăng nhập -> Đá về trang /login
  // Lưu lại đường dẫn họ đang muốn vào (state.url) để sau khi login xong có thể nhảy lại đúng trang đó
  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
