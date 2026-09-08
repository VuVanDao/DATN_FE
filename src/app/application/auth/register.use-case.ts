import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { RegisterRequest, RegisterResponse } from '../../domain/models/auth.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegisterUseCase {
  private readonly _authRepository = inject(AuthRepository);
  execute(request: RegisterRequest): Observable<RegisterResponse> {
    const normalizeRequest: RegisterRequest = {
      ...request,
      Email: request.Email.trim().toLocaleLowerCase(),
      Username: request.Username.trim(),
    };
    return this._authRepository.Register(normalizeRequest);
  }
}
