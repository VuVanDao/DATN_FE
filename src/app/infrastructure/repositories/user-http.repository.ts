import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordRequest, UpdateProfileRequest, User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ApiResponse } from '../dtos/api-response.dto';
import { UserResponse } from '../dtos/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable({
  providedIn: 'root',
})
export class UserHttpRepository implements UserRepository {
  private readonly API_URL = `${environment.apiUrl}/users`;
  private readonly http = inject(HttpClient);

  changePassword(request: ChangePasswordRequest): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.API_URL}/change-password`, {
        ...request,
      })
      .pipe(map((res) => res.data));
  }

  getCurrentUser(): Observable<User> {
    return this.http
      .get<ApiResponse<UserResponse>>(`${this.API_URL}/me`)
      .pipe(map((res) => UserMapper.toUser(res.data)));
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http
      .put<ApiResponse<UserResponse>>(`${this.API_URL}/me`, { ...request })
      .pipe(map((res) => UserMapper.toUser(res.data)));
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    // Command bên BE đang để là File
    formData.append('File', file, file.name);
    return this.http
      .post<ApiResponse<string>>(`${this.API_URL}/me/avatar`, formData)
      .pipe(map((res) => res.data));
  }
}
