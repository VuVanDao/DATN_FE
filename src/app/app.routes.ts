import { Routes } from '@angular/router';
import { Authlayout } from './presentation/layouts/auth-layout/auth-layout';
import { LoginPage } from './presentation/pages/auth/login';
import { RegisterPage } from './presentation/pages/auth/register';
import { MainLayout } from './presentation/layouts/main-layout/main-layout';
import { HomePage } from './presentation/pages/home/home';
import { authGuard } from './presentation/guards/auth.guards';
import { SettingsPage } from './presentation/pages/settings/settings';
import { MainSecurityPage } from './presentation/pages/security/main-security-page';
import { ProfilePage } from './presentation/pages/profile/profile';
import { guestGuard } from './presentation/guards/guest.guards';

import { ForgotPasswordPage } from './presentation/pages/auth/forgot-password';
import { ResetPasswordPage } from './presentation/pages/auth/reset-password';

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
        path: 'settings',
        component: SettingsPage,
      },
      {
        path: 'security',
        component: MainSecurityPage,
      },
      {
        path: 'workspaces',
        component: HomePage, // Trang danh sách tất cả workspace sẽ bổ sung sau
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
