import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { permissions } from './core/permissions/permissions';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app/dashboard',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((routes) => routes.authRoutes),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(
        (component) => component.AuthLayoutComponent,
      ),
    children: [
      {
        path: '',
        title: 'Choose new password | InvoMir',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password.component').then(
            (component) => component.ResetPasswordComponent,
          ),
      },
    ],
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(
        (component) => component.AuthLayoutComponent,
      ),
    children: [
      {
        path: '',
        title: 'Verify email | InvoMir',
        loadComponent: () =>
          import('./features/auth/pages/verify-email/verify-email.component').then(
            (component) => component.VerifyEmailComponent,
          ),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout.component').then(
        (component) => component.DashboardLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: {
          permissions: [permissions.dashboard.view],
        },
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((routes) => routes.dashboardRoutes),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'app/dashboard',
  },
];
