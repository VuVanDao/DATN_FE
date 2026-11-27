import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class RefreshTokenUseCase {
  private readonly authRepository = inject(AuthRepository);

  execute(): Observable<LoginResponse> {
    return this.authRepository.refreshToken();
  }
}
