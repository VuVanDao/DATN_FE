import { inject, Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadAvatarUseCase {
  private readonly _userRepository = inject(UserRepository);
  execute(file: File): Observable<string> {
    return this._userRepository.UploadAvatar(file);
  }
}
