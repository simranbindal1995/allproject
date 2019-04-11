import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";

import { User } from '../../models/user';


import { CommonService } from '../../services/common.service';
import { AuthGuardGuard } from '../../services/auth-guard.guard';

import swal from 'sweetalert2'
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public busy: Subscription;
  public userModel: User;
  public emailPattern = "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  public api: string = environment.apiUrl;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private authService: AuthService,
  ) {
    this.userModel = new User();
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/usermangement']);
      return true;
    }
  }

  /*login*/
  onLogin() {
    this.busy =
      this.commonService.putService(this.api + 'admin/login'
        , this.userModel)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.router.navigate(['/usermangement']);
          }
          else {
            swal(data.message)
          }
        }, err => {
          swal({
            text: err.message,
            type: 'error'
          });
        })
  }

  // On Forgot password link click
  onForgotPassword() {
    this.router.navigate(['forgot-password'], { relativeTo: this.route.parent });
  }
}
