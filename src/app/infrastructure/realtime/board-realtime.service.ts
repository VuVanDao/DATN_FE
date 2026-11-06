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
import {
  CardMovedMessage,
  ColumnsReorderedMessage,
} from '../../domain/models/board-realtime.model';
import { AuthStorageService } from '../storage/auth-storage.service';

export type SignalRConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({
  providedIn: 'root',
})
export class BoardRealtimeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authStorage = inject(AuthStorageService);

  private hubConnection: HubConnection | null = null;
  private currentBoardId: string | null = null;
  private isConnecting = false;

  private readonly columnsReorderedSubject = new Subject<ColumnsReorderedMessage>();
  readonly columnsReordered$ = this.columnsReorderedSubject.asObservable();

  private readonly cardMovedSubject = new Subject<CardMovedMessage>();
  readonly cardMoved$ = this.cardMovedSubject.asObservable();

  private readonly reconnectedSubject = new Subject<void>();
  readonly reconnected$ = this.reconnectedSubject.asObservable();

  private readonly connectionStatusSignal = signal<SignalRConnectionStatus>('disconnected');
  readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getHubUrl(): string {
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/hubs/board`;
  }

  private async ensureConnected(): Promise<void> {
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

        this.hubConnection.on('ColumnsReordered', (message: ColumnsReorderedMessage) => {
          this.columnsReorderedSubject.next(message);
        });

        this.hubConnection.on('CardMoved', (message: CardMovedMessage) => {
          this.cardMovedSubject.next(message);
        });

        this.hubConnection.onreconnecting(() => {
          this.connectionStatusSignal.set('reconnecting');
        });

        this.hubConnection.onreconnected(async () => {
          this.connectionStatusSignal.set('connected');
          if (this.currentBoardId && this.hubConnection) {
            try {
              await this.hubConnection.invoke('JoinBoard', this.currentBoardId);
            } catch (err) {
              console.warn('[BoardRealtimeService] Re-joining board failed after reconnect', err);
            }
          }
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
      console.warn('[BoardRealtimeService] Failed to establish SignalR connection', err);
    } finally {
      this.isConnecting = false;
    }
  }

  async joinBoard(boardId: string): Promise<void> {
    if (!this.isBrowser() || !boardId) return;

    if (this.currentBoardId && this.currentBoardId.toLowerCase() !== boardId.toLowerCase()) {
      await this.leaveBoard(this.currentBoardId);
    }

    this.currentBoardId = boardId;
    await this.ensureConnected();

    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('JoinBoard', boardId);
      } catch (err) {
        console.warn(`[BoardRealtimeService] Failed to join board ${boardId}`, err);
      }
    }
  }

  async leaveBoard(boardId: string): Promise<void> {
    if (!this.isBrowser() || !boardId) return;

    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveBoard', boardId);
      } catch (err) {
        console.warn(`[BoardRealtimeService] Failed to leave board ${boardId}`, err);
      }
    }

    if (this.currentBoardId && this.currentBoardId.toLowerCase() === boardId.toLowerCase()) {
      this.currentBoardId = null;
    }
  }

  async stopConnection(): Promise<void> {
    if (!this.isBrowser() || !this.hubConnection) return;

    if (this.currentBoardId) {
      await this.leaveBoard(this.currentBoardId);
    }

    try {
      await this.hubConnection.stop();
    } catch (err) {
      console.warn('[BoardRealtimeService] Error while stopping connection', err);
    } finally {
      this.hubConnection = null;
      this.connectionStatusSignal.set('disconnected');
    }
  }
}
