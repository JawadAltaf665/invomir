import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';
import { permissions } from '../../core/permissions/permissions';

export const invoiceRoutes: Routes = [
  {
    path: '',
    title: 'Invoices | InvoMir',
    loadComponent: () =>
      import('./pages/invoice-list/invoice-list.component').then(
        (component) => component.InvoiceListComponent,
      ),
  },
  {
    path: 'new',
    title: 'New invoice | InvoMir',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.invoice.create],
    },
    loadComponent: () =>
      import('./pages/invoice-form/invoice-form.component').then(
        (component) => component.InvoiceFormComponent,
      ),
  },
  {
    path: ':id/edit',
    title: 'Edit invoice | InvoMir',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.invoice.update],
    },
    loadComponent: () =>
      import('./pages/invoice-form/invoice-form.component').then(
        (component) => component.InvoiceFormComponent,
      ),
  },
  {
    path: ':id',
    title: 'Invoice details | InvoMir',
    loadComponent: () =>
      import('./pages/invoice-detail/invoice-detail.component').then(
        (component) => component.InvoiceDetailComponent,
      ),
  },
];
