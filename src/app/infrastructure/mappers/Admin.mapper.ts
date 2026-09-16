import { UserMangement, UserMangementResponse } from '../../domain/models/admin.model';
import { User } from '../../domain/models/user.model';

export class AdminMapper {
  static toAdminUser(dto: UserMangementResponse): UserMangement {
    const userMangement: UserMangement = {
      Id: dto.id,
      Email: dto.email,
      UserName: dto.username,
      AvatarUrl: dto.avatarUrl ?? undefined,
      Bio: dto.bio,
      Role: dto.role,
      IsActive: dto.isActive,
      CreatedAt: dto.createdAt,
      IsDeleted: dto.isDeleted,
    };

    return userMangement;
  }
}
