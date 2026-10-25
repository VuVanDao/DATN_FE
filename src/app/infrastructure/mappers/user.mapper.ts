import { User } from '../../domain/models/user.model';
import { UserResponse } from '../dtos/user.dto';

export class UserMapper {
  static toUser(data: UserResponse): User {
    const user: User = {
      id: data.id,
      email: data.email,
      userName: data.username,
      avatarUrl: data.avatarUrl ?? undefined,
      bio: data.bio ?? '',
      isActive: data.isActive,
      createdAt: data.createdAt,
      role: data.role,
    };
    return user;
  }
}
