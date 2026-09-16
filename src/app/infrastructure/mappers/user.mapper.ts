import { User, UserResponse } from '../../domain/models/user.model';

export class UserMapper {
  static toUser(data: UserResponse): User {
    const user: User = {
      Id: data.id,
      Email: data.email,
      UserName: data.username,
      AvatarUrl: data.avatarUrl ?? undefined,
      Bio: data.bio ?? '',
      IsActive: data.isActive,
      CreatedAt: data.createdAt,
      Role: data.role,
    };
    return user;
  }
}
