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
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
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
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false, // Bật/tắt theo class dark nếu thích
        },
      },
    }),
    provideAnimationsAsync(),
  ],
};
