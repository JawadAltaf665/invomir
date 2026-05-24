import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'accept-invitation/:token',
    renderMode: RenderMode.Server,
  },
  {
    path: 'app/admin/users/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'app/clients/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'app/clients/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'app/invoices/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'app/invoices/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
