import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallsService } from './api-calls.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthCheckService {

  constructor(private router: Router, public api: ApiCallsService) { }

  public isAuthenticated(): boolean {
    const token = true;
    return token;
  }

  public isLoggedIn(): boolean {
    let access_token = JSON.parse(localStorage.getItem('access_token'));
    let status = (access_token != null && access_token.value) ? true : false;
    return status;
  }

  public isUserProfileComplete() {
    let user = JSON.parse(localStorage.getItem('userData'));

    let status = (user != null && user.user_status == 1) ? true : false;

    if (!status) {
      this.api.getRequest('Brand/myProfile?skip=0&limit=10').then(
        (res) => {
          this.setLocalStorageData(res.data.my_profileData, 'userData');
          if (!res.data.country) {
            document.getElementById("completeProfileModalShowButton").click();
          }
        },
        (err) => {
        }
      );
    } else {
    }
  }
  userInfo: object = {};
  public getUserInfo(): any {
    this.userInfo = JSON.parse(localStorage.getItem('userData'));
    return this.userInfo;
  }
  public setUserLogin(userData: any): boolean {
    localStorage.setItem('userData', JSON.stringify(userData));
    return true;
  }

  public setLocalStorageData(data: any, key: string) {
    localStorage.setItem(key, JSON.stringify(data))
  }
  public removeLocalStorageData(key: string) {
    localStorage.removeItem(key)
  }


  public getLocalStorageData(key: string) {
    return  localStorage.getItem(key)
  }


}
