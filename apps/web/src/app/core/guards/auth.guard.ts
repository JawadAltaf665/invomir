import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthSessionService } from '../auth/auth-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  return authSession.ensureAuthenticated().pipe(
    map(isAuthenticated =>
      isAuthenticated
        ? true
        : router.createUrlTree(['/auth/login'], {
            queryParams: {
              returnUrl: state.url
            }
          })
    )
  );
};

export const authChildGuard: CanActivateChildFn = (_route, state) => authGuard(_route, state);
