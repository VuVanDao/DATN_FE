import { AuthTokens, LoginResponse } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { AuthResponseDto } from '../dtos/auth.dto';

export class AuthMapper {
  static toLoginResponse(dto: AuthResponseDto): LoginResponse {
    const user: User = {
      Id: dto.id,
      Email: dto.email,
      UserName: dto.username,
      AvatarUrl: dto.avatarUrl ?? undefined,
      Role: dto.role,
      IsActive: dto.isActive,
      CreatedAt: dto.createdAt,
    };
    const tokens: AuthTokens = {
      AccessToken: dto.token,
      RefreshToken: dto.refreshToken,
      RefreshTokenExpiresAt: dto.refreshTokenExpiresAt
        ? new Date(dto.refreshTokenExpiresAt).getTime()
        : undefined,
    };
    return {
      User: user,
      Tokens: tokens,
    };
  }
}
