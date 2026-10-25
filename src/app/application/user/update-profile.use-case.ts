import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateProfileRequest, User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateProfileUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(request: UpdateProfileRequest): Observable<User> {
    return this._userRepository.updateProfile(request);
  }
}
