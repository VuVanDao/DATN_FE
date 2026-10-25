import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';

@Injectable({
  providedIn: 'root',
})
export class GetRolesUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(): Observable<Role[]> {
    return this._adminRepository.getRoles();
  }
}
