import { Observable } from 'rxjs';
import {
  UserMangement,
  UserMangementResponse,
  GetUserManagementParams,
  PagedResult,
  Role,
  UpdateUserStatusRequest,
} from '../models/admin.model';

export abstract class AdminRepository {
  abstract GetUsers(params: GetUserManagementParams): Observable<PagedResult<UserMangement>>;
  abstract UpdateUserStatus(request: UpdateUserStatusRequest): Observable<boolean>;
  // Gán vai trò cho một người dùng
  abstract AssignUserRole(userId: string, roleId: string): Observable<boolean>;
  abstract GetRoles(): Observable<Role[]>;
}
