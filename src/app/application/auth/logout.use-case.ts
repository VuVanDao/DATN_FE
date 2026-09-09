import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogoutUseCase {
  private readonly _authRepository = inject(AuthRepository);
  execute(): Observable<void> {
    return this._authRepository.Logout();
  }
}
