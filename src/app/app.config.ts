import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthRepository } from './domain/repositories/auth.repository';
import { AuthHttpRepository } from './infrastructure/repositories/auth-http.repository';
import { AuthInterceptor } from './infrastructure/http/auth.interceptor';

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
  ],
};
