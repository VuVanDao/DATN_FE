import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserStatusRequest } from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';

@Injectable({
  providedIn: 'root',
})
export class UpdateUserStatusUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(request: UpdateUserStatusRequest): Observable<boolean> {
    const normalizedRequest: UpdateUserStatusRequest = {
      ...request,
      reason: request.reason?.trim() || undefined,
    };
    return this._adminRepository.updateUserStatus(normalizedRequest);
  }
}
