import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeleteUserUseCase {
  private readonly _adminRepository = inject(AdminRepository);

  execute(userId: string): Observable<boolean> {
    return this._adminRepository.DeleteUser(userId);
  }
}
