import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserNotification } from '../../domain/models/user-notification.model';
import { AuthStorageService } from '../storage/auth-storage.service';
import { SignalRConnectionStatus } from './board-realtime.service';

export interface NotificationMarkedReadMessage {
  notificationId: string;
  readAt: string | null;
}

export interface NotificationsReadAllMessage {
  readAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationRealtimeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authStorage = inject(AuthStorageService);

  private hubConnection: HubConnection | null = null;
  private isConnecting = false;

  private readonly notificationReceivedSubject = new Subject<UserNotification>();
  readonly notificationReceived$ = this.notificationReceivedSubject.asObservable();

  private readonly notificationMarkedReadSubject = new Subject<NotificationMarkedReadMessage>();
  readonly notificationMarkedRead$ = this.notificationMarkedReadSubject.asObservable();

  private readonly notificationsReadAllSubject = new Subject<NotificationsReadAllMessage>();
  readonly notificationsReadAll$ = this.notificationsReadAllSubject.asObservable();

  private readonly reconnectedSubject = new Subject<void>();
  readonly reconnected$ = this.reconnectedSubject.asObservable();

  private readonly connectionStatusSignal = signal<SignalRConnectionStatus>('disconnected');
  readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getHubUrl(): string {
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/hubs/notifications`;
  }

  async startConnection(): Promise<void> {
    if (!this.isBrowser()) return;

    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      return;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return;
    }

    const token = this.authStorage.getAccessToken();
    if (!token) {
      return;
    }

    this.isConnecting = true;
    this.connectionStatusSignal.set('connecting');

    try {
      if (!this.hubConnection) {
        this.hubConnection = new HubConnectionBuilder()
          .withUrl(this.getHubUrl(), {
            accessTokenFactory: () => this.authStorage.getAccessToken() ?? '',
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(environment.production ? LogLevel.None : LogLevel.Information)
          .build();

        this.hubConnection.on('NotificationReceived', (message: UserNotification) => {
          this.notificationReceivedSubject.next(message);
        });

        this.hubConnection.on(
          'NotificationMarkedRead',
          (message: NotificationMarkedReadMessage) => {
            this.notificationMarkedReadSubject.next(message);
          },
        );

        this.hubConnection.on('NotificationsReadAll', (message: NotificationsReadAllMessage) => {
          this.notificationsReadAllSubject.next(message);
        });

        this.hubConnection.onreconnecting(() => {
          this.connectionStatusSignal.set('reconnecting');
        });

        this.hubConnection.onreconnected(() => {
          this.connectionStatusSignal.set('connected');
          this.reconnectedSubject.next();
        });

        this.hubConnection.onclose(() => {
          this.connectionStatusSignal.set('disconnected');
        });
      }

      if (this.hubConnection.state === HubConnectionState.Disconnected) {
        await this.hubConnection.start();
        this.connectionStatusSignal.set('connected');
      }
    } catch (err) {
      this.connectionStatusSignal.set('disconnected');
      console.warn('[NotificationRealtimeService] Failed to establish SignalR connection', err);
    } finally {
      this.isConnecting = false;
    }
  }

  async stopConnection(): Promise<void> {
    if (!this.isBrowser() || !this.hubConnection) return;

    try {
      await this.hubConnection.stop();
    } catch (err) {
      console.warn('[NotificationRealtimeService] Error while stopping connection', err);
    } finally {
      this.hubConnection = null;
      this.connectionStatusSignal.set('disconnected');
    }
  }
}
