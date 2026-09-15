import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthRepository } from './domain/repositories/auth.repository';
import { AuthHttpRepository } from './infrastructure/repositories/auth-http.repository';
import { AuthInterceptor } from './infrastructure/http/auth.interceptor';
import { UserRepository } from './domain/repositories/user.repository';
import { UserHttpRepository } from './infrastructure/repositories/user-http.repository';
import { SecurityRepository } from './domain/repositories/security.repository';
import { SecurityHttpRepository } from './infrastructure/repositories/security-http.repository';
import { AdminRepository } from './domain/repositories/admin.repository';
import { AdminHttpRepository } from './infrastructure/repositories/admin-http.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),
    {
      provide: AuthRepository,
      useClass: AuthHttpRepository,
    },
    {
      provide: UserRepository,
      useClass: UserHttpRepository,
    },
    {
      provide: SecurityRepository,
      useClass: SecurityHttpRepository,
    },
    {
      provide: AdminRepository,
      useClass: AdminHttpRepository,
    },
  ],
};
