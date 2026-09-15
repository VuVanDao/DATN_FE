import { Observable } from 'rxjs';
import {
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  UserResponse,
} from '../models/user.model';

export abstract class UserRepository {
  abstract ChangePassword(request: ChangePasswordRequest): Observable<boolean>;
  abstract GetCurrentUser(): Observable<User>;
  abstract UpdateProfile(request: UpdateProfileRequest): Observable<User>;
  abstract UploadAvatar(file: File): Observable<string>;
}
