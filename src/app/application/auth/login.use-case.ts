import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { LoginRequest, LoginResponse } from '../../domain/models/auth.model';
import { Observable } from 'rxjs';

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
    return this._authRepository.Login(normalizeRequest);
  }
}
