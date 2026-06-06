import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: '',
    title: 'Notifications | InvoMir',
    loadComponent: () =>
      import('./pages/notification-list/notification-list.component').then(
        (component) => component.NotificationListComponent,
      ),
  },
];
