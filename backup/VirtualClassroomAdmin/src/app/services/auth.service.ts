import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AuthService {

  constructor(
    private router: Router
  ) { }

  /* STORE USER TOKEN AND OTHER DETAILS  */
  storeUserInfo(input: any) {
    const data = {
      token: input.headers.get('x-logintoken')
    };
    localStorage.setItem('userInfo', JSON.stringify(data));
  }

  removeUserInfo() {
    localStorage.removeItem('userInfo');
  }

  /* GET LOGIN USER INFORMATION  */
  getUserInfo() {
    return JSON.parse(localStorage.getItem('userInfo'));
  }

  /* USER LOGOUT SERVICE  */
  logout(): boolean {
    localStorage.removeItem('userInfo');
    this.router.navigate(['/login']);
    return true;
  }

  /* IS USER AUTHENTICATED */
  isAuthenticated(): boolean {
    const auth_token: any = JSON.parse(localStorage.getItem('userInfo')) || '';
    if (auth_token.token && auth_token.token !== undefined) {
      return true;
    } else {
      return false;
    }
  }
}
