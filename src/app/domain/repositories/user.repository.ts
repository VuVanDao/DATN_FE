import { Observable } from 'rxjs';
import { ChangePasswordRequest, User } from '../models/user.model';

export abstract class UserRepository {
  abstract ChangePassword(request: ChangePasswordRequest): Observable<boolean>;
  abstract GetCurrentUser(): Observable<User>;
}
