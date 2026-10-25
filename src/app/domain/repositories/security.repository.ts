import { Observable } from 'rxjs';
import { LoginHistory } from '../models/user.model';

export abstract class SecurityRepository {
  abstract getMyLoginHistory(limit?: number): Observable<LoginHistory[]>;
}
