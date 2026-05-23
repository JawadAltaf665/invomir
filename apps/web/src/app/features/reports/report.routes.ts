import { Routes } from '@angular/router';

export const reportRoutes: Routes = [
  {
    path: '',
    title: 'Reports | InvoMir',
    loadComponent: () =>
      import('./pages/report-list/report-list.component').then(
        (component) => component.ReportListComponent,
      ),
  },
];
