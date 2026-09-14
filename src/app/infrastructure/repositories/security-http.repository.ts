import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../dtos/auth.dto';
import { LoginHistory, LoginHistoryResponse } from '../../domain/models/user.model';
import { SecurityRepository } from '../../domain/repositories/security.repository';

@Injectable({ providedIn: 'root' })
export class SecurityHttpRepository implements SecurityRepository {
  private readonly apiUrl = `${environment.apiUrl}/security`;
  private readonly http = inject(HttpClient);

  GetMyLoginHistory(limit = 20): Observable<LoginHistory[]> {
    return this.http
      .get<ApiResponse<LoginHistoryResponse[]>>(`${this.apiUrl}/me/login-history`, {
        params: { limit },
      })
      .pipe(
        map((response) =>
          response.data.map((item) => ({
            Id: item.id,
            UserId: item.userId,
            EmailAttempted: item.emailAttempted,
            IpAddress: item.ipAddress,
            UserAgent: item.userAgent,
            IsSuccess: item.isSuccess,
            FailureReason: item.failureReason,
            CreatedAt: item.createdAt,
          })),
        ),
      );
  }
}
