import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RegisterRequest, RegisterResponse } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class RegisterUseCase {
  private readonly _authRepository = inject(AuthRepository);
  execute(request: RegisterRequest): Observable<RegisterResponse> {
    const normalizeRequest: RegisterRequest = {
      ...request,
      email: request.email.trim().toLocaleLowerCase(),
      username: request.username.trim(),
    };
    return this._authRepository.register(normalizeRequest);
  }
}
