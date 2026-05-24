import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    title: 'Settings | InvoMir',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (component) => component.SettingsPageComponent,
      ),
  },
];
