import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginHistory } from '../../domain/models/user.model';
import { SecurityRepository } from '../../domain/repositories/security.repository';
import { ApiResponse } from '../dtos/api-response.dto';
import { LoginHistoryResponse } from '../dtos/user.dto';

@Injectable({ providedIn: 'root' })
export class SecurityHttpRepository implements SecurityRepository {
  private readonly apiUrl = `${environment.apiUrl}/security`;
  private readonly http = inject(HttpClient);

  getMyLoginHistory(limit = 20): Observable<LoginHistory[]> {
    return this.http
      .get<ApiResponse<LoginHistoryResponse[]>>(`${this.apiUrl}/me/login-history`, {
        params: { limit },
      })
      .pipe(
        map((response) =>
          response.data.map((item) => ({
            id: item.id,
            userId: item.userId,
            emailAttempted: item.emailAttempted,
            ipAddress: item.ipAddress,
            userAgent: item.userAgent,
            isSuccess: item.isSuccess,
            failureReason: item.failureReason,
            createdAt: item.createdAt,
          })),
        ),
      );
  }
}
