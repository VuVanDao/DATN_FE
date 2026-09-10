import { inject, Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ChangePasswordRequest } from '../../domain/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChangePasswordUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(request: ChangePasswordRequest): Observable<boolean> {
    return this._userRepository.ChangePassword(request);
  }
}
