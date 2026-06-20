import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';
import { permissions } from '../../core/permissions/permissions';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'email-templates',
  },
  {
    path: 'email-templates',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.system.access],
    },
    title: 'Email templates | InvoMir',
    loadComponent: () =>
      import('./pages/email-template-list/email-template-list.component').then(
        (component) => component.EmailTemplateListComponent,
      ),
  },
  {
    path: 'email-templates/create',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.system.access],
    },
    title: 'Create email template | InvoMir',
    loadComponent: () =>
      import('./pages/email-template-editor/email-template-editor.component').then(
        (component) => component.EmailTemplateEditorComponent,
      ),
  },
  {
    path: 'email-templates/:id/edit',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.system.access],
    },
    title: 'Edit email template | InvoMir',
    loadComponent: () =>
      import('./pages/email-template-editor/email-template-editor.component').then(
        (component) => component.EmailTemplateEditorComponent,
      ),
  },
  {
    path: 'queued-emails',
    canActivate: [permissionGuard],
    data: {
      permissions: [permissions.system.access],
    },
    title: 'Queued emails | InvoMir',
    loadComponent: () =>
      import('./pages/queued-email-list/queued-email-list.component').then(
        (component) => component.QueuedEmailListComponent,
      ),
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
