import { inject, Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Observable } from 'rxjs';
import { UpdateProfileRequest, User } from '../../domain/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateProfileUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(request: UpdateProfileRequest): Observable<User> {
    return this._userRepository.UpdateProfile(request);
  }
}
