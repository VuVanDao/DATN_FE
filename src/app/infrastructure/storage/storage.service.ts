import { Injectable } from '@angular/core';
import { AuthTokens } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly ACCESS_TOKEN_KEY = 'datn_access_token';
  private readonly REFRESH_TOKEN_KEY = 'datn_refresh_token';
  private readonly USER_DATA_KEY = 'datn_user_data';
  saveAuthData(tokens: AuthTokens, user: User): void {
    if (this.IsBrowser()) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.AccessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.RefreshToken);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    }
  }
  getAccessToken(): string | null {
    return this.IsBrowser() ? localStorage.getItem(this.ACCESS_TOKEN_KEY) : null;
  }
  getRefreshToken(): string | null {
    return this.IsBrowser() ? localStorage.getItem(this.REFRESH_TOKEN_KEY) : null;
  }
  getUserData(): User | null {
    if (!this.IsBrowser()) return null;
    const rawData = localStorage.getItem(this.USER_DATA_KEY);
    return rawData ? JSON.parse(rawData) : null;
  }
  private IsBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
  clear(): void {
    if (this.IsBrowser()) {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
    }
  }
}
