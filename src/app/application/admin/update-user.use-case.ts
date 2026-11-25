import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUpdateUserRequest, UserManagement } from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(userId: string, request: AdminUpdateUserRequest): Observable<UserManagement> {
    const normalizedRequest: AdminUpdateUserRequest = {
      username: request.username.trim(),
      bio: request.bio?.trim(),
    };
    return this._adminRepository.updateUser(userId, normalizedRequest);
  }
}
