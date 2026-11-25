import { UserManagement } from '../../domain/models/admin.model';
import { UserManagementResponse } from '../dtos/admin.dto';

export class AdminMapper {
  static toAdminUser(dto: UserManagementResponse): UserManagement {
    const userManagement: UserManagement = {
      id: dto.id,
      email: dto.email,
      userName: dto.username,
      avatarUrl: dto.avatarUrl ?? undefined,
      bio: dto.bio,
      role: dto.role,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      isDeleted: dto.isDeleted,
    };

    return userManagement;
  }
}
