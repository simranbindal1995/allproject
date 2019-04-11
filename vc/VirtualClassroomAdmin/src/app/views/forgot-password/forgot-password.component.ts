import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { User } from '../../models/user';

import { CommonService } from '../../services/common.service';

import swal from 'sweetalert2'
import { Observable} from 'rxjs';
import { map, tap,catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {environment} from '../../../environments/environment';



@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  public busy: Subscription;
  public userModel: User;
  public emailPattern = "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  public api: string = environment.apiUrl;


  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private commonService: CommonService,
    ) {
    this.userModel = new User();
   }

  ngOnInit() {
  }

  //ON Forgot click
  onForgot() {
    console.log(this.userModel);
    this.commonService.postService(this.api + 'admin/forgotPassword'
    ,this.userModel)
    .subscribe(data => {
     console.log(data);
        if (data.statusCode == 200) {
          swal({
            type: 'success',
            title: 'Success',
            text: data.message,
          }).then((result) => {
            if (result.value) {
              this.router.navigate(['/']);
            }
          })       
         } 
        else {
          console.log(data.message);
          swal(data.message)
        }
      })
  }
  
  // on login click
  onLogin() {
    this.router.navigate([''], { relativeTo: this.route.parent });
}

}
