
import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthCheckService } from './auth-check.service';

@Injectable()
export class AuthenticationService implements CanActivate {
  constructor(public auth: AuthCheckService, public router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['index']);
      return false;
    }
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['index']);
      return false;
    }
    return true;
  }


}


