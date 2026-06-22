import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  router.navigateByUrl('/login');
  return false;
};
