import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthSessionService } from '../auth/auth-session.service';
import { Permission } from '../permissions/permissions';

export const permissionGuard: CanActivateFn = (route, _state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const requiredPermissions = (route.data['permissions'] ?? []) as readonly Permission[];

  if (!isPlatformBrowser(platformId)) {
    // Browser storage is unavailable during SSR, so defer permission enforcement to hydration.
    return true;
  }

  return authSession.ensureAuthenticated().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return router.createUrlTree(['/auth/login']);
      }

      if (requiredPermissions.length === 0 || authSession.hasAnyPermission(requiredPermissions)) {
        return true;
      }

      return router.createUrlTree(['/app/dashboard']);
    }),
  );
};
