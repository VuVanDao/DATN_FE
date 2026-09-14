import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { ResetPasswordRequest } from '../../domain/models/auth.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordUseCase {
  private readonly _authRepository = inject(AuthRepository);

  execute(request: ResetPasswordRequest): Observable<boolean> {
    const req: ResetPasswordRequest = {
      ...request,
      Email: request.Email.trim().toLocaleLowerCase(),
    };
    return this._authRepository.ResetPassword(req);
  }
}
