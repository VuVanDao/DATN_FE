import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AssignUserRoleUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(userId: string, roleId: string): Observable<boolean> {
    return this._adminRepository.AssignUserRole(userId, roleId);
  }
}
