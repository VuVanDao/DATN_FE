import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable({
  providedIn: 'root',
})
export class UploadAvatarUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(file: File): Observable<string> {
    return this._userRepository.uploadAvatar(file);
  }
}
