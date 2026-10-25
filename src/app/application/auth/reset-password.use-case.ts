import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResetPasswordRequest } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordUseCase {
  private readonly _authRepository = inject(AuthRepository);

  execute(request: ResetPasswordRequest): Observable<boolean> {
    const req: ResetPasswordRequest = {
      ...request,
      email: request.email.trim().toLocaleLowerCase(),
    };
    return this._authRepository.resetPassword(req);
  }
}
