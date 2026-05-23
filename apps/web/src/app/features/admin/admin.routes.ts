import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';
import { permissions } from '../../core/permissions/permissions';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'users',
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.system.users.view],
    },
    title: 'Admin users | InvoMir',
    loadComponent: () =>
      import('./pages/admin-user-list/admin-user-list.component').then(
        (component) => component.AdminUserListComponent,
      ),
  },
  {
    path: 'users/:id',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.system.users.view],
    },
    title: 'Admin user | InvoMir',
    loadComponent: () =>
      import('./pages/admin-user-details/admin-user-details.component').then(
        (component) => component.AdminUserDetailsComponent,
      ),
  },
];
