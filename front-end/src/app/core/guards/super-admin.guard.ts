import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();
  if (user?.isSuperAdmin === true) {
    return true;
  }
  // Redirect silently to dashboard — don't hint that /admin exists
  return router.createUrlTree(['/']);
};
