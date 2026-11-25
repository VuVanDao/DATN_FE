import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class LoginUseCase {
  private readonly _authRepository = inject(AuthRepository);

  execute(request: LoginRequest): Observable<LoginResponse> {
    const normalizeRequest: LoginRequest = {
      ...request,
      email: request.email.trim().toLocaleLowerCase(),
    };
    return this._authRepository.login(normalizeRequest);
  }
}
