import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { UpdateUserStatusRequest } from '../../domain/models/admin.model';
import { Observable } from 'rxjs';

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
    return this._adminRepository.UpdateUserStatus(normalizedRequest);
  }
}
