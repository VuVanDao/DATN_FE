import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { AdminUpdateUserRequest, UserMangement } from '../../domain/models/admin.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(userId: string, request: AdminUpdateUserRequest): Observable<UserMangement> {
    const normalizedRequest: AdminUpdateUserRequest = {
      username: request.username.trim(),
      bio: request.bio?.trim(),
    };
    return this._adminRepository.UpdateUser(userId, normalizedRequest);
  }
}
