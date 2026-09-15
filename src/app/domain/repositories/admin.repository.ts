import { Observable } from 'rxjs';
import {
  AdminUser,
  AdminUserResponse,
  GetAdminUsersParams,
  PagedResult,
  Role,
  UpdateUserStatusRequest,
} from '../models/admin.model';

export abstract class AdminRepository {
  abstract GetUsers(params: GetAdminUsersParams): Observable<PagedResult<AdminUser>>;
  abstract UpdateUserStatus(request: UpdateUserStatusRequest): Observable<boolean>;
  // Gán danh sách vai trò cho một người dùng
  abstract AssignUserRoles(userId: string, roleIds: string[]): Observable<boolean>;
  abstract GetRoles(): Observable<Role[]>;
}
