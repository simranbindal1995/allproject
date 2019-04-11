import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormControl, FormBuilder, Validators, Validator } from '@angular/forms';
import { PasswordValidation } from '../../validations/confirmPassword.validator'
import { UserPassword } from '../../models/userpassword';

import { CommonService } from '../../services/common.service';

import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

import swal from 'sweetalert2'

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  public form: FormGroup;
  public userModel: UserPassword;
  public api: string = environment.apiUrl;
  public busy: Subscription;
  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private location: Location
  ) {


    this.userModel = new UserPassword();

    this.form = fb.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    })

  }



  ngOnInit() {
    //this.onChange();
  }

  onChange() {
    this.userModel.oldPassword = this.form.get('password').value;
    this.userModel.newPassword = this.form.get('confirmPassword').value;

    console.log(this.userModel);

    this.busy =
      this.commonService.putService(this.api + 'admin/changePassword'
        , this.userModel)
        .subscribe(data => {
          if (data.statusCode == 200) {
            swal({
              position: 'top-end',
              type: 'success',
              title: data.message,
              showConfirmButton: false,
              timer: 1500
            }).then((result) => {

              location.reload()
            })
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



}
