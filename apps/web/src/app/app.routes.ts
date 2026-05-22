import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { permissions } from './core/permissions/permissions';
import { clientRoutes } from './features/clients/client.routes';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { invoiceRoutes } from './features/invoices/invoice.routes';

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
        children: dashboardRoutes,
      },
      {
        path: 'invoices',
        canActivate: [permissionGuard],
        data: {
          permissions: [permissions.invoice.view],
        },
        children: invoiceRoutes,
      },
      {
        path: 'clients',
        canActivate: [permissionGuard],
        data: {
          permissions: [permissions.client.view],
        },
        children: clientRoutes,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'app/dashboard',
  },
];
