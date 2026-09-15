import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. Các trang công khai (Public) -> Cho phép Prerender
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'register',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'forgot-password',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'reset-password',
    renderMode: RenderMode.Prerender,
  },

  // 2. Toàn bộ các trang nghiệp vụ nội bộ còn lại (Dashboard, Profile, Settings, Admin, Boards,...)
  // Render hoàn toàn ở phía Trình duyệt (Client), tránh Node.js SSR gọi API thiếu token dẫn đến lỗi 401 văng trang
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
