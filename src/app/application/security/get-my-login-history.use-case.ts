import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginHistory } from '../../domain/models/user.model';
import { SecurityRepository } from '../../domain/repositories/security.repository';

@Injectable({ providedIn: 'root' })
export class GetMyLoginHistoryUseCase {
  private readonly securityRepository = inject(SecurityRepository);

  execute(limit = 20): Observable<LoginHistory[]> {
    return this.securityRepository.getMyLoginHistory(limit);
  }
}
