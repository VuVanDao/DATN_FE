import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly SESSION_TOKEN_KEY = 'datn_session_access_token';
  private readonly _accessToken = signal<string | null>(this.getInitialToken());

  readonly accessToken = this._accessToken.asReadonly();

  // xác định có phải đang ở trình duyệt không
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  private getInitialToken(): string | null {
    if (this.isBrowser()) {
      return sessionStorage.getItem(this.SESSION_TOKEN_KEY);
    }
    return null;
  }

  getAccessToken(): string | null {
    // kiểm tra RAM xem có token chưa
    const mem = this._accessToken();
    if (mem) return mem;

    if (this.isBrowser()) {
      // kiểm tra sesionStorage xem có token chưa
      const stored = sessionStorage.getItem(this.SESSION_TOKEN_KEY);
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
        sessionStorage.setItem(this.SESSION_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(this.SESSION_TOKEN_KEY);
      }
    }
  }

  clear(): void {
    this._accessToken.set(null);
    if (this.isBrowser()) {
      sessionStorage.removeItem(this.SESSION_TOKEN_KEY);
    }
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }
}
