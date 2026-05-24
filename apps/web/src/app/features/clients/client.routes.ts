import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';
import { permissions } from '../../core/permissions/permissions';

export const clientRoutes: Routes = [
  {
    path: '',
    title: 'Clients | InvoMir',
    loadComponent: () =>
      import('./pages/client-list/client-list.component').then(
        (component) => component.ClientListComponent,
      ),
  },
  {
    path: 'new',
    title: 'New client | InvoMir',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.client.create],
    },
    loadComponent: () =>
      import('./pages/client-create/client-create.component').then(
        (component) => component.ClientCreateComponent,
      ),
  },
  {
    path: ':id/edit',
    title: 'Edit client | InvoMir',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.client.update],
    },
    loadComponent: () =>
      import('./pages/client-edit/client-edit.component').then(
        (component) => component.ClientEditComponent,
      ),
  },
  {
    path: ':id',
    title: 'Client details | InvoMir',
    loadComponent: () =>
      import('./pages/client-details/client-details.component').then(
        (component) => component.ClientDetailsComponent,
      ),
  },
];
