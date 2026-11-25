import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ForgotPasswordRequest } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordUseCase {
  private readonly _authRepository = inject(AuthRepository);

  execute(request: ForgotPasswordRequest): Observable<string> {
    const req: ForgotPasswordRequest = {
      email: request.email.trim().toLocaleLowerCase(),
    };
    return this._authRepository.forgotPassword(req);
  }
}
