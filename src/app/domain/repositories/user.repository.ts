import { Observable } from 'rxjs';
import { ChangePasswordRequest, UpdateProfileRequest, User } from '../models/user.model';

export abstract class UserRepository {
  abstract changePassword(request: ChangePasswordRequest): Observable<boolean>;
  abstract getCurrentUser(): Observable<User>;
  abstract updateProfile(request: UpdateProfileRequest): Observable<User>;
  abstract uploadAvatar(file: File): Observable<string>;
}
