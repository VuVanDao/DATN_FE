import { Observable } from 'rxjs';
import { PagedResult } from '../../shared/models/paged-result.model';
import {
  AdminUpdateUserRequest,
  CreateUserRequest,
  GetUserManagementParams,
  Role,
  UpdateUserStatusRequest,
  UserManagement,
} from '../models/admin.model';

export abstract class AdminRepository {
  abstract getUsers(params: GetUserManagementParams): Observable<PagedResult<UserManagement>>;
  abstract updateUserStatus(request: UpdateUserStatusRequest): Observable<boolean>;
  // Gán vai trò cho một người dùng
  abstract assignUserRole(userId: string, roleId: string): Observable<boolean>;
  abstract getRoles(): Observable<Role[]>;
  // Tạo mới người dùng (Admin)
  abstract createUser(request: CreateUserRequest): Observable<string>;
  // Cập nhật thông tin người dùng (Admin)
  abstract updateUser(userId: string, request: AdminUpdateUserRequest): Observable<UserManagement>;
  // Xóa mềm người dùng (Admin)
  abstract deleteUser(userId: string): Observable<boolean>;
}
