import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserRequest } from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';

@Injectable({
  providedIn: 'root',
})
export class CreateUserUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(request: CreateUserRequest): Observable<string> {
    const normalizedRequest: CreateUserRequest = {
      ...request,
      email: request.email.trim().toLowerCase(),
      username: request.username.trim(),
      bio: request.bio?.trim(),
    };
    return this._adminRepository.createUser(normalizedRequest);
  }
}
