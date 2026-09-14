import { Observable } from 'rxjs';
import { LoginHistory } from '../models/user.model';

export abstract class SecurityRepository {
  abstract GetMyLoginHistory(limit?: number): Observable<LoginHistory[]>;
}
