import { Observable } from 'rxjs';
import { ChangePasswordRequest } from '../models/user.model';

export abstract class UserRepository {
  abstract ChangePassword(request: ChangePasswordRequest): Observable<boolean>;
}
