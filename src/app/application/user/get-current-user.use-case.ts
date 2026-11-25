import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable({
  providedIn: 'root',
})
export class GetCurrentUserUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(): Observable<User> {
    return this._userRepository.getCurrentUser();
  }
}
