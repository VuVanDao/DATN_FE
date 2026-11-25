import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminRepository } from '../../domain/repositories/admin.repository';

@Injectable({
  providedIn: 'root',
})
export class AssignUserRoleUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(userId: string, roleId: string): Observable<boolean> {
    return this._adminRepository.assignUserRole(userId, roleId);
  }
}
