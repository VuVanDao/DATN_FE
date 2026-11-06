import { computed, inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { LoginResponse } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { AuthStorageService } from '../../infrastructure/storage/auth-storage.service';

/** Owns the current session and invalidates requests synchronously on logout. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = inject(AuthStorageService);
  private readonly user = signal<User | null>(this.storage.getUser());
  private readonly ended = new Subject<void>();

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => !!this.user());
  readonly ended$ = this.ended.asObservable();

  establish(response: LoginResponse): void {
    this.storage.setAccessToken(response.tokens.accessToken);
    this.updateUser(response.user);
  }

  updateUser(user: User): void {
    this.user.set(user);
    this.storage.setUser(user);
  }

  clear(): void {
    this.storage.clear();
    this.user.set(null);
    this.ended.next();
  }
}
