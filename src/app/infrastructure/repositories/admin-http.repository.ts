import { inject, Injectable } from '@angular/core';
import { AdminRepository } from '../../domain/repositories/admin.repository';
import { map, Observable } from 'rxjs';
import {
  GetUserManagementParams,
  PagedResult,
  UserMangement,
  UpdateUserStatusRequest,
  Role,
  UserMangementResponse,
} from '../../domain/models/admin.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '../dtos/auth.dto';
import { AdminMapper } from '../mappers/Admin.mapper';

@Injectable({
  providedIn: 'root',
})
export class AdminHttpRepository extends AdminRepository {
  private readonly API_URL = `${environment.apiUrl}/admin`;
  private readonly http = inject(HttpClient);
  GetUsers(params: GetUserManagementParams): Observable<PagedResult<UserMangement>> {
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
      .get<ApiResponse<PagedResult<UserMangementResponse>>>(`${this.API_URL}/users`, {
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
  UpdateUserStatus(request: UpdateUserStatusRequest): Observable<boolean> {
    return this.http
      .patch<ApiResponse<boolean>>(`${this.API_URL}/users/${request.userId}/status`, {
        isActive: request.IsActive,
        reason: request.reason,
      })
      .pipe(map((res) => res.data));
  }
  AssignUserRole(userId: string, roleId: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.API_URL}/users/${userId}/role`, { roleId })
      .pipe(map((res) => res.data));
  }
  GetRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.API_URL}/roles`).pipe(
      map((res) => {
        return (res.data || []).map((r: any) => ({
          Id: r.id || r.Id,
          Name: r.name || r.Name,
          Description: r.description || r.Description,
          Scope: r.scope || r.Scope,
          IsSystemRole: r.isSystemRole ?? r.IsSystemRole ?? false,
        }));
      }),
    );
  }
}
