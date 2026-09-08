import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { Observable } from 'rxjs';
import { User } from '../../domain/models/user.model';

Injectable({
  providedIn: 'root',
});
export class GetCurrentUserUseCase {
  private readonly _authRepository = inject(AuthRepository);
  execute(): Observable<User> {
    return this._authRepository.GetCurrentUser();
  }
}
