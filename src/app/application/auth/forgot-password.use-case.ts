import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { ForgotPasswordRequest } from '../../domain/models/auth.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordUseCase {
  private readonly _authRepository = inject(AuthRepository);

  execute(request: ForgotPasswordRequest): Observable<string> {
    const req: ForgotPasswordRequest = {
      email: request.email.trim().toLocaleLowerCase(),
    };
    return this._authRepository.ForgotPassword(req);
  }
}
