import { Injectable } from '@angular/core';
import { AuthStore } from './auth.store';

/**
 * @deprecated Đã hợp nhất toàn bộ dữ liệu người dùng vào AuthStore (Single Source of Truth).
 * Vui lòng inject trực tiếp `AuthStore` thay vì `UserStore`.
 */
@Injectable({
  providedIn: 'root',
  useExisting: AuthStore,
})
export class UserStore extends AuthStore {}
