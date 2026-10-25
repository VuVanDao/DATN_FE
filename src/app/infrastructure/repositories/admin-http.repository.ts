import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUpdateUserRequest,
  CreateUserRequest,
  GetUserManagementParams,
  Role,
  UpdateUserStatusRequest,
  UserManagement,
} from '../../domain/models/admin.model';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { PagedResult } from '../../shared/models/paged-result.model';
import { UserManagementResponse } from '../dtos/admin.dto';
import { ApiResponse } from '../dtos/api-response.dto';
import { AdminMapper } from '../mappers/admin-user.mapper';

@Injectable({
  providedIn: 'root',
})
export class AdminHttpRepository extends AdminRepository {
  private readonly API_URL = `${environment.apiUrl}/admin`;
  private readonly http = inject(HttpClient);
  getUsers(params: GetUserManagementParams): Observable<PagedResult<UserManagement>> {
    let httpParams = new HttpParams();
    if (params.search) {
      httpParams = httpParams.set('Search', params.search);
    }
    if (params.isActive !== undefined && params.isActive !== null) {
      httpParams = httpParams.set('IsActive', params.isActive.toString());
    }
    if (params.pageIndex) {
      httpParams = httpParams.set('PageIndex', params.pageIndex.toString());
    }
    if (params.pageSize) {
      httpParams = httpParams.set('PageSize', params.pageSize.toString());
    }
    return this.http
      .get<ApiResponse<PagedResult<UserManagementResponse>>>(`${this.API_URL}/users`, {
        params: httpParams,
      })
      .pipe(
        map((res) => {
          const data = res.data;
          const adminUserRes = data.items.map((item) => {
            return AdminMapper.toAdminUser(item);
          });

          return {
            items: adminUserRes,
            hasNextPage: data.hasNextPage,
            hasPreviousPage: data.hasPreviousPage,
            pageIndex: data.pageIndex,
            pageSize: data.pageSize,
            totalCount: data.totalCount,
            totalPages: data.totalPages,
          };
        }),
      );
  }
  updateUserStatus(request: UpdateUserStatusRequest): Observable<boolean> {
    return this.http
      .patch<ApiResponse<boolean>>(`${this.API_URL}/users/${request.userId}/status`, {
        isActive: request.isActive,
        reason: request.reason,
      })
      .pipe(map((res) => res.data));
  }
  assignUserRole(userId: string, roleId: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.API_URL}/users/${userId}/role`, { roleId })
      .pipe(map((res) => res.data));
  }
  getRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.API_URL}/roles`).pipe(
      map((res) => {
        return (res.data || []).map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          scope: r.scope,
          isSystemRole: r.isSystemRole ?? false,
        }));
      }),
    );
  }
  createUser(request: CreateUserRequest): Observable<string> {
    return this.http
      .post<ApiResponse<string>>(`${this.API_URL}/users`, request)
      .pipe(map((res) => res.data));
  }
  updateUser(userId: string, request: AdminUpdateUserRequest): Observable<UserManagement> {
    return this.http
      .put<ApiResponse<UserManagementResponse>>(`${this.API_URL}/users/${userId}`, request)
      .pipe(map((res) => AdminMapper.toAdminUser(res.data)));
  }
  deleteUser(userId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.API_URL}/users/${userId}`)
      .pipe(map((res) => res.data));
  }
}
