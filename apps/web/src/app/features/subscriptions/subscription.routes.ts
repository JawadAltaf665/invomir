import { Routes } from '@angular/router';

export const subscriptionRoutes: Routes = [
  {
    path: '',
    title: 'Subscriptions | InvoMir',
    loadComponent: () =>
      import('./pages/subscription-page/subscription-page.component').then(
        (component) => component.SubscriptionPageComponent,
      ),
  },
];
