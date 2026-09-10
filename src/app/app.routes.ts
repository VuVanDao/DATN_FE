import { Routes } from '@angular/router';
import { Authlayout } from './presentation/layouts/auth-layout/auth-layout';
import { LoginPage } from './presentation/pages/auth/login';
import { RegisterPage } from './presentation/pages/auth/register';
import { MainLayout } from './presentation/layouts/main-layout/main-layout';
import { HomePage } from './presentation/pages/home/home';
import { authGuard } from './presentation/guards/auth.guards';

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
    ],
  },
  {
    path: '',
    component: Authlayout,
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
    ],
  },
];
