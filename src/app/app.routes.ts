import { Routes } from '@angular/router';
import { Authlayout } from './presentation/layouts/auth-layout/auth-layout';
import { LoginPage } from './presentation/pages/auth/login';
import { RegisterPage } from './presentation/pages/auth/register';
import { MainLayout } from './presentation/layouts/main-layout/main-layout';
import { HomePage } from './presentation/pages/home/home';
import { authGuard } from './presentation/guards/auth.guards';
import { ChangePasswordPage } from './presentation/pages/change-password/change-password-page';
import { ProfilePage } from './presentation/pages/profile/profile';
import { guestGuard } from './presentation/guards/guest.guards';

import { ForgotPasswordPage } from './presentation/pages/auth/forgot-password';
import { ResetPasswordPage } from './presentation/pages/auth/reset-password';
import { adminGuard } from './presentation/guards/admin.guards';
import { AdminManageUserPage } from './presentation/pages/admin/users/admin-manage-users.page';
import { WorkspacesPage } from './presentation/pages/workspaces/workspaces.page';
import { WorkspaceDetailPage } from './presentation/pages/workspaces/workspace-detail/workspace-detail.page';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home-page',
        pathMatch: 'full',
      },
      {
        path: 'home-page',
        component: HomePage,
      },
      {
        path: 'profile',
        component: ProfilePage,
      },
      {
        path: 'change-password',
        component: ChangePasswordPage,
      },
      {
        path: 'workspaces',
        component: WorkspacesPage,
      },
      {
        path: 'workspaces/:slug',
        component: WorkspaceDetailPage,
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            redirectTo: 'users',
            pathMatch: 'full',
          },
          {
            path: 'users',
            component: AdminManageUserPage,
          },
        ],
      },
    ],
  },
  {
    path: '',
    component: Authlayout,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: LoginPage,
      },
      {
        path: 'register',
        component: RegisterPage,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordPage,
      },
      {
        path: 'reset-password',
        component: ResetPasswordPage,
      },
    ],
  },
];
