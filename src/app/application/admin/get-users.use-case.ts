import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { GetUserManagementParams, PagedResult, UserManagement } from '../../domain/models/admin.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetUsersUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(params: GetUserManagementParams): Observable<PagedResult<UserManagement>> {
    return this._adminRepository.GetUsers(params);
  }
}
