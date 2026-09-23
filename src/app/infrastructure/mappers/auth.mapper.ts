import { AuthTokens, LoginResponse } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { AuthResponseDto } from '../dtos/auth.dto';

export class AuthMapper {
  static toLoginResponse(dto: AuthResponseDto): LoginResponse {
    const user: User = {
      id: dto.id,
      email: dto.email,
      userName: dto.username,
      avatarUrl: dto.avatarUrl ?? undefined,
      role: dto.role,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
    };
    const tokens: AuthTokens = {
      accessToken: dto.token,
      refreshToken: dto.refreshToken,
      refreshTokenExpiresAt: dto.refreshTokenExpiresAt
        ? new Date(dto.refreshTokenExpiresAt).getTime()
        : undefined,
    };
    return {
      user: user,
      tokens: tokens,
    };
  }
}
