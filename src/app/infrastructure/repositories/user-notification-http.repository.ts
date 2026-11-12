import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserNotification,
  UserNotificationList,
} from '../../domain/models/user-notification.model';
import { UserNotificationRepository } from '../../domain/repositories/user-notification.repository';
import { ApiResponse } from '../dtos/api-response.dto';

@Injectable({
  providedIn: 'root',
})
export class UserNotificationHttpRepository extends UserNotificationRepository {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  private readonly http = inject(HttpClient);

  getNotifications(
    pageIndex = 1,
    pageSize = 20,
    unreadOnly = false,
  ): Observable<UserNotificationList> {
    return this.http
      .get<ApiResponse<UserNotificationList>>(this.API_URL, {
        params: { pageIndex, pageSize, unreadOnly },
      })
      .pipe(map((res) => res.data));
  }

  markAsRead(notificationId: string): Observable<UserNotification> {
    return this.http
      .patch<ApiResponse<UserNotification>>(`${this.API_URL}/${notificationId}/read`, {})
      .pipe(map((res) => res.data));
  }

  markAllAsRead(): Observable<number> {
    return this.http
      .patch<ApiResponse<number>>(`${this.API_URL}/read-all`, {})
      .pipe(map((res) => res.data ?? 0));
  }
}
