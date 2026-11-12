import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { NotificationService } from './application/shared/notification.service';
import { AuthStore } from './application/state/auth.store';
import { AdminRepository } from './domain/repositories/admin.repository';
import { AiRepository } from './domain/repositories/ai.repository';
import { AuthRepository } from './domain/repositories/auth.repository';
import { BoardRepository } from './domain/repositories/board.repository';
import { ProjectRepository } from './domain/repositories/project.repository';
import { SecurityRepository } from './domain/repositories/security.repository';
import { SprintRepository } from './domain/repositories/sprint.repository';
import { UserNotificationRepository } from './domain/repositories/user-notification.repository';
import { UserRepository } from './domain/repositories/user.repository';
import { WorkspaceRepository } from './domain/repositories/workspace.repository';
import { AuthInterceptor } from './infrastructure/http/auth.interceptor';
import { MockAiAssistantService } from './infrastructure/mocks/mock-ai-assistant.service';
import { AdminHttpRepository } from './infrastructure/repositories/admin-http.repository';
import { AuthHttpRepository } from './infrastructure/repositories/auth-http.repository';
import { BoardHttpRepository } from './infrastructure/repositories/board-http.repository';
import { ProjectHttpRepository } from './infrastructure/repositories/project-http.repository';
import { SecurityHttpRepository } from './infrastructure/repositories/security-http.repository';
import { SprintHttpRepository } from './infrastructure/repositories/sprint-http.repository';
import { UserHttpRepository } from './infrastructure/repositories/user-http.repository';
import { UserNotificationHttpRepository } from './infrastructure/repositories/user-notification-http.repository';
import { WorkspaceHttpRepository } from './infrastructure/repositories/workspace-http.repository';
import { ToastNotificationService } from './presentation/services/toast-notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: AiRepository, useClass: MockAiAssistantService },
    { provide: NotificationService, useClass: ToastNotificationService },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      return authStore.initSession();
    }),
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
    {
      provide: WorkspaceRepository,
      useClass: WorkspaceHttpRepository,
    },
    {
      provide: ProjectRepository,
      useClass: ProjectHttpRepository,
    },
    {
      provide: BoardRepository,
      useClass: BoardHttpRepository,
    },
    {
      provide: SprintRepository,
      useClass: SprintHttpRepository,
    },
    {
      provide: UserNotificationRepository,
      useClass: UserNotificationHttpRepository,
    },
  ],
};
