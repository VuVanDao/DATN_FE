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
      Roles: dto.roles,
    };
    const tokens: AuthTokens = {
      AccessToken: dto.token,
      RefreshToken: dto.refreshToken,
      RefreshTokenExpiresAt: new Date(dto.refreshTokenExpiresAt).getTime(),
    };
    return {
      User: user,
      Tokens: tokens,
    };
  }
}
