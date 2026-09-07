export interface User {
  Id: string;
  Email: string;
  UserName: string;
  AvatarUrl?: string;
  Bio?: string;
  IsActive?: boolean;
  Roles: string[];
}
