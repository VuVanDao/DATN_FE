import { Injectable } from '@angular/core';

/** UI feedback port. The application layer does not depend on a toast library. */
@Injectable()
export abstract class NotificationService {
  abstract success(message: string): void;
  abstract error(message: string): void;
  abstract warning(message: string): void;
}
