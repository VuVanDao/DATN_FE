import { User } from './user.model';

export interface UserManagement extends User {
  IsDeleted: boolean;
}
export interface UserManagementResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  role: string;
  isDeleted: boolean;
}
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface GetUserManagementParams {
  search?: string; // Từ khóa tìm kiếm (email hoặc username)
  isActive?: boolean; // Lọc theo trạng thái tài khoản: true (hoạt động), false (bị khóa), undefined (tất cả)
  pageIndex?: number; // Trang cần lấy
  pageSize?: number; // Kích thước trang
}
export interface UpdateUserStatusRequest {
  userId: string;
  IsActive: boolean;
  reason?: string;
}
export interface Role {
  Id: string;
  Name: string;
  Description?: string;
  Scope: string;
  IsSystemRole: boolean;
}
export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  bio?: string;
}
export interface AdminUpdateUserRequest {
  username: string;
  bio?: string;
}
