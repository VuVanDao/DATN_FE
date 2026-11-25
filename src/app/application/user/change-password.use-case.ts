import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChangePasswordRequest } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable({
  providedIn: 'root',
})
export class ChangePasswordUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(request: ChangePasswordRequest): Observable<boolean> {
    return this._userRepository.changePassword(request);
  }
}
