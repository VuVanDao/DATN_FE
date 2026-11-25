import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class LogoutUseCase {
  private readonly _authRepository = inject(AuthRepository);
  execute(): Observable<void> {
    return this._authRepository.logout();
  }
}
