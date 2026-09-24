import { Injectable } from '@angular/core';
import { User } from '../../domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly USER_DATA_KEY = 'datn_user_data';

  saveUserData(user: User): void {
    if (this.IsBrowser()) {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    }
  }

  getUserData(): User | null {
    if (!this.IsBrowser()) return null;
    try {
      const rawData = localStorage.getItem(this.USER_DATA_KEY);
      return rawData ? JSON.parse(rawData) : null;
    } catch {
      localStorage.removeItem(this.USER_DATA_KEY);
      return null;
    }
  }

  private IsBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  clear(): void {
    if (this.IsBrowser()) {
      // Dọn dẹp cả key cũ nếu còn sót trong browser
      localStorage.removeItem('datn_access_token');
      localStorage.removeItem('datn_refresh_token');
      localStorage.removeItem(this.USER_DATA_KEY);
    }
  }
}
