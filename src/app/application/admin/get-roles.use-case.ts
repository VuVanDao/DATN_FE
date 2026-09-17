import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { Role } from '../../domain/models/admin.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetRolesUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(): Observable<Role[]> {
    return this._adminRepository.GetRoles();
  }
}
