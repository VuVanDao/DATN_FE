import { Routes } from '@angular/router';
import { Authlayout } from './presentation/layouts/auth-layout/auth-layout';
import { LoginPage } from './presentation/pages/auth/login';
import { RegisterPage } from './presentation/pages/auth/register';

export const routes: Routes = [
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
