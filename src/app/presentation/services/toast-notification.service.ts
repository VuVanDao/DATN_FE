import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';
import { NotificationService } from '../../application/shared/notification.service';

@Injectable()
export class ToastNotificationService extends NotificationService {
  success(message: string): void {
    toast.success(message);
  }
  error(message: string): void {
    toast.error(message);
  }
  warning(message: string): void {
    toast.warning(message);
  }
}
