import { Observable } from 'rxjs';
import { UserNotification, UserNotificationList } from '../models/user-notification.model';

export abstract class UserNotificationRepository {
  abstract getNotifications(
    pageIndex?: number,
    pageSize?: number,
    unreadOnly?: boolean,
  ): Observable<UserNotificationList>;

  abstract markAsRead(notificationId: string): Observable<UserNotification>;

  abstract markAllAsRead(): Observable<number>;
}
