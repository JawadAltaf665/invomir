import { Routes } from '@angular/router';

export const auditLogRoutes: Routes = [
  {
    path: '',
    title: 'Audit logs | InvoMir',
    loadComponent: () =>
      import('./pages/audit-log-list/audit-log-list.component').then(
        (component) => component.AuditLogListComponent,
      ),
  },
];
