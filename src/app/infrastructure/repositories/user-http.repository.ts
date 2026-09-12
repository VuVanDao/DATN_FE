import { inject, Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { map, Observable } from 'rxjs';
import { ChangePasswordRequest, User, UserResponse } from '../../domain/models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../dtos/auth.dto';
import { UserMapper } from '../mappers/user.mapper';

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
  GetCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.API_URL}/me`).pipe(
      map((res) => {
        const data = res.data;
        return UserMapper.toUser(data);
      }),
    );
  }
}
