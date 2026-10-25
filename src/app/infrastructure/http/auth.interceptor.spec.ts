import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { SessionRefreshService } from '../../application/auth/session-refresh.service';
import { SessionService } from '../../application/auth/session.service';
import { NotificationService } from '../../application/shared/notification.service';
import { LoginResponse } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { TokenService } from '../storage/token.service';
import { AuthInterceptor } from './auth.interceptor';

const response: LoginResponse = {
  user: { id: 'user', email: 'u@test.local', userName: 'User', role: 'User' },
  tokens: { accessToken: 'new-token' },
};

describe('AuthInterceptor session refresh', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let refresh$: Subject<LoginResponse>;
  let refreshToken: ReturnType<typeof vi.fn>;
  let notifications: { error: ReturnType<typeof vi.fn> };
  let session: SessionService;

  beforeEach(() => {
    refresh$ = new Subject();
    refreshToken = vi.fn(() => refresh$);
    notifications = { error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([AuthInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthRepository, useValue: { refreshToken } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    session = TestBed.inject(SessionService);
    session.establish({ ...response, tokens: { accessToken: 'old-token' } });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    controller.verify();
    session.clear();
  });

  it('shares one refresh and retries both requests with the new token', () => {
    const received = vi.fn();
    http.get(environment.apiUrl + '/one').subscribe(received);
    http.get(environment.apiUrl + '/two').subscribe(received);
    controller
      .expectOne(environment.apiUrl + '/one')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne(environment.apiUrl + '/two')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(refreshToken).toHaveBeenCalledOnce();
    refresh$.next(response);
    refresh$.complete();
    for (const endpoint of ['/one', '/two']) {
      const retry = controller.expectOne(environment.apiUrl + endpoint);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
      retry.flush({ ok: true });
    }
    expect(received).toHaveBeenCalledTimes(2);
  });

  it('clears the session and reports an expired session once for concurrent 401s', () => {
    const onError = vi.fn();
    http.get(environment.apiUrl + '/one').subscribe({ error: onError });
    http.get(environment.apiUrl + '/two').subscribe({ error: onError });
    controller
      .expectOne(environment.apiUrl + '/one')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne(environment.apiUrl + '/two')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    refresh$.error(new Error('expired'));
    expect(session.currentUser()).toBeNull();
    expect(TestBed.inject(TokenService).getAccessToken()).toBeNull();
    expect(notifications.error).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('does not restore a session when a refresh finishes after logout', () => {
    TestBed.inject(SessionRefreshService).refresh().subscribe();
    session.clear();
    refresh$.next(response);
    expect(session.currentUser()).toBeNull();
    expect(TestBed.inject(TokenService).getAccessToken()).toBeNull();
    refreshToken.mockReturnValue(of(response));
    TestBed.inject(SessionRefreshService).refresh().subscribe();
    expect(session.currentUser()?.id).toBe('user');
    expect(refreshToken).toHaveBeenCalledTimes(2);
  });

  it('keeps credentials off external URLs', () => {
    http.get('https://external.test/resource').subscribe();
    const request = controller.expectOne('https://external.test/resource');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });

  it('retries a late 401 with the already renewed token without refreshing again', () => {
    http.get(environment.apiUrl + '/late').subscribe();
    TestBed.inject(TokenService).setAccessToken('new-token');
    controller
      .expectOne(environment.apiUrl + '/late')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    const retry = controller.expectOne(environment.apiUrl + '/late');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(refreshToken).not.toHaveBeenCalled();
    retry.flush({});
  });
});
