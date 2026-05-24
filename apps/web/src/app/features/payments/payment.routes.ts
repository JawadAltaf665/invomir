import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: '',
    title: 'Payments | InvoMir',
    loadComponent: () =>
      import('./pages/payment-list/payment-list.component').then(
        (component) => component.PaymentListComponent,
      ),
  },
];
