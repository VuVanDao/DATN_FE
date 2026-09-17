import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { CreateUserRequest } from '../../domain/models/admin.model';
import { Observable } from 'rxjs';

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
    return this._adminRepository.CreateUser(normalizedRequest);
  }
}
