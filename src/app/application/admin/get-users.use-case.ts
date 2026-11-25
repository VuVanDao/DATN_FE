import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetUserManagementParams, UserManagement } from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { PagedResult } from '../../shared/models/paged-result.model';

@Injectable({
  providedIn: 'root',
})
export class GetUsersUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(params: GetUserManagementParams): Observable<PagedResult<UserManagement>> {
    return this._adminRepository.getUsers(params);
  }
}
