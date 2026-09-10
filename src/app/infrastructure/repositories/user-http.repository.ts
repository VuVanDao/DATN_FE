import { inject, Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { map, Observable } from 'rxjs';
import { ChangePasswordRequest } from '../../domain/models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../dtos/auth.dto';

@Injectable({
  providedIn: 'root',
})
export class UserHttpRepository implements UserRepository {
  private readonly API_URL = `${environment.apiUrl}/users`;
  private readonly http = inject(HttpClient);
  ChangePassword(request: ChangePasswordRequest): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.API_URL}/change-password`, {
        ...request,
      })
      .pipe(
        map((res) => {
          return res.data;
        }),
      );
  }
}
