import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, CanActivate } from '@angular/router';
import { AuthCheckService } from './auth-check.service';

@Injectable()
export class PrivateGuard implements CanActivate {

  constructor(public auth: AuthCheckService, public router: Router) { }
  canActivate(): boolean {

    // //console.log("trying to access private state and the use is this.auth.isLoggedIn()",this.auth.isLoggedIn())
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['landing']);
      return false;
    }
    return true;
  }
}


@Injectable()
export class PublicGuard implements CanActivate {

  constructor(public auth: AuthCheckService, public router: Router) { }
  canActivate(): boolean {
    // //console.log("trying to access public state and the use is this.auth.isLoggedIn()",this.auth.isLoggedIn())
   
   
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['dashboard']);
      return false;
    }
    return true;
  }
}

