import { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../layout/auth-layout/auth-layout.component').then(component => component.AuthLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        title: 'Sign in | InvoMir',
        loadComponent: () => import('./pages/login/login.component').then(component => component.LoginComponent)
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        title: 'Create account | InvoMir',
        loadComponent: () => import('./pages/register/register.component').then(component => component.RegisterComponent)
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        title: 'Reset password | InvoMir',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then(
            component => component.ForgotPasswordComponent
          )
      },
      {
        path: 'reset-password',
        title: 'Choose new password | InvoMir',
        loadComponent: () =>
          import('./pages/reset-password/reset-password.component').then(component => component.ResetPasswordComponent)
      },
      {
        path: 'verify-email',
        title: 'Verify email | InvoMir',
        loadComponent: () =>
          import('./pages/verify-email/verify-email.component').then(component => component.VerifyEmailComponent)
      }
    ]
  }
];
