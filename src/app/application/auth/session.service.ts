import { computed, inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { LoginResponse } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { TokenService } from '../../infrastructure/storage/token.service';

/** Owns the current session and invalidates requests synchronously on logout. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = inject(StorageService);
  private readonly tokens = inject(TokenService);
  private readonly user = signal<User | null>(this.storage.getUserData());
  private readonly ended = new Subject<void>();

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => !!this.user());
  readonly ended$ = this.ended.asObservable();

  establish(response: LoginResponse): void {
    this.tokens.setAccessToken(response.tokens.accessToken);
    this.updateUser(response.user);
  }

  updateUser(user: User): void {
    this.user.set(user);
    this.storage.saveUserData(user);
  }

  clear(): void {
    this.tokens.clear();
    this.storage.clear();
    this.user.set(null);
    this.ended.next();
  }
}
