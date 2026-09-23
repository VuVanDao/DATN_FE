import { Observable } from 'rxjs';
import {
  UserManagement,
  UserManagementResponse,
  GetUserManagementParams,
  PagedResult,
  Role,
  UpdateUserStatusRequest,
  CreateUserRequest,
  AdminUpdateUserRequest,
} from '../models/admin.model';

export abstract class AdminRepository {
  abstract GetUsers(params: GetUserManagementParams): Observable<PagedResult<UserManagement>>;
  abstract UpdateUserStatus(request: UpdateUserStatusRequest): Observable<boolean>;
  // Gán vai trò cho một người dùng
  abstract AssignUserRole(userId: string, roleId: string): Observable<boolean>;
  abstract GetRoles(): Observable<Role[]>;
  // Tạo mới người dùng (Admin)
  abstract CreateUser(request: CreateUserRequest): Observable<string>;
  // Cập nhật thông tin người dùng (Admin)
  abstract UpdateUser(userId: string, request: AdminUpdateUserRequest): Observable<UserManagement>;
  // Xóa mềm người dùng (Admin)
  abstract DeleteUser(userId: string): Observable<boolean>;
}
