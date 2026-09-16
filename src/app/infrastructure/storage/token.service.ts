import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly _accessToken = signal<string | null>(null);

  readonly accessToken = this._accessToken.asReadonly();

  getAccessToken(): string | null {
    return this._accessToken();
  }

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
  }

  clear(): void {
    this._accessToken.set(null);
  }

  hasToken(): boolean {
    return !!this._accessToken();
  }
}
