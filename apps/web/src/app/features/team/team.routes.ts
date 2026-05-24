import { Routes } from '@angular/router';

export const teamRoutes: Routes = [
  {
    path: '',
    title: 'Team members | InvoMir',
    loadComponent: () =>
      import('./pages/team-page/team-page.component').then(
        (component) => component.TeamPageComponent,
      ),
  },
];
