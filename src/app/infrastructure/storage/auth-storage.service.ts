import { Injectable, signal } from '@angular/core';
import { User } from '../../domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  private readonly ACCESS_TOKEN_KEY = 'datn_access_token';
  private readonly USER_DATA_KEY = 'datn_user_data';

  private readonly _accessToken = signal<string | null>(this.getInitialToken());
  readonly accessToken = this._accessToken.asReadonly();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getInitialToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getAccessToken(): string | null {
    const mem = this._accessToken();
    if (mem) return mem;

    if (this.isBrowser()) {
      const stored = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (stored) {
        this._accessToken.set(stored);
        return stored;
      }
    }
    return null;
  }

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
    if (this.isBrowser()) {
      if (token) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      }
    }
  }

  getUser(): User | null {
    if (!this.isBrowser()) return null;
    try {
      const rawData = localStorage.getItem(this.USER_DATA_KEY);
      return rawData ? JSON.parse(rawData) : null;
    } catch {
      localStorage.removeItem(this.USER_DATA_KEY);
      return null;
    }
  }

  setUser(user: User | null): void {
    if (!this.isBrowser()) return;
    if (user) {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_DATA_KEY);
    }
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  clear(): void {
    this._accessToken.set(null);
    if (this.isBrowser()) {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      // Dọn dẹp cả key cũ nếu còn sót lại ở sessionStorage hoặc localStorage
      localStorage.removeItem('datn_refresh_token');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('datn_session_access_token');
      }
    }
  }
}
