import { Routes } from '@angular/router';
import { authGuard } from './presentation/guards/auth.guards';
import { guestGuard } from './presentation/guards/guest.guards';
import { adminGuard } from './presentation/guards/admin.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/layouts/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home-page',
        pathMatch: 'full',
      },
      {
        path: 'home-page',
        loadComponent: () => import('./presentation/pages/home/home').then((m) => m.HomePage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./presentation/pages/profile/profile').then((m) => m.ProfilePage),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./presentation/pages/change-password/change-password-page').then(
            (m) => m.ChangePasswordPage,
          ),
      },
      {
        path: 'workspaces',
        loadComponent: () =>
          import('./presentation/pages/workspaces/workspaces.page').then((m) => m.WorkspacesPage),
      },
      {
        path: 'workspaces/:slug',
        loadComponent: () =>
          import('./presentation/pages/workspaces/workspace-detail/workspace-detail.page').then(
            (m) => m.WorkspaceDetailPage,
          ),
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
            loadComponent: () =>
              import('./presentation/pages/admin/users/admin-manage-users.page').then(
                (m) => m.AdminManageUserPage,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./presentation/layouts/auth-layout/auth-layout').then((m) => m.Authlayout),
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./presentation/pages/auth/login').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./presentation/pages/auth/register').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./presentation/pages/auth/forgot-password').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./presentation/pages/auth/reset-password').then((m) => m.ResetPasswordPage),
      },
    ],
  },
];
