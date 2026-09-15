import { AdminUser, AdminUserResponse } from '../../domain/models/admin.model';
import { User } from '../../domain/models/user.model';

export class AdminMapper {
  static toAdminUser(dto: AdminUserResponse): AdminUser {
    const adminUser: AdminUser = {
      Id: dto.id,
      Email: dto.email,
      UserName: dto.username,
      AvatarUrl: dto.avatarUrl ?? undefined,
      Roles: dto.roles,
      IsActive: dto.isActive,
      CreatedAt: dto.createdAt,
    };

    return adminUser;
  }
}
