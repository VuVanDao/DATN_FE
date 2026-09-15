import { inject, Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { map, Observable } from 'rxjs';
import {
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  UserResponse,
} from '../../domain/models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../dtos/auth.dto';
import { UserMapper } from '../mappers/user.mapper';
import { StorageService } from '../storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class UserHttpRepository implements UserRepository {
  private readonly API_URL = `${environment.apiUrl}/users`;
  private readonly http = inject(HttpClient);
  private readonly _storageService = inject(StorageService);
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
  UpdateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.API_URL}/me`, { ...request }).pipe(
      map((res) => {
        const user: User = UserMapper.toUser(res.data);
        this._storageService.saveUserData(user);
        return user;
      }),
    );
  }
  UploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    // Command been BE ddang dder laf File
    formData.append('File', file, file.name);
    return this.http.post<ApiResponse<string>>(`${this.API_URL}/me/avatar`, formData).pipe(
      map((res) => {
        return res.data;
      }),
    );
  }
}
