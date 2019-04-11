import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from '../../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from '../../stateChange.service';
import { AppComponent } from '../../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from '../../loader/loader-service'
import { ModalComponent } from '../../modal/modal.component'
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  public changePasswordForm: FormGroup;
  public requestData: any;
  public success_message: any;
  public error_message: any;
  public changePasswordFormButton: boolean = false;
  @ViewChild('modalComponentChangePass')
  modalComponent: ModalComponent;
  settingsData: string = 'change controller value';
  constructor(private fb: FormBuilder, private router: Router, public api: ApiCallsService, public auth: AuthCheckService, private loader: LoaderService) {
    this.changePasswordValidate();
  }

  ngOnInit() {

  }


  changePasswordValidate() {
    this.changePasswordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.pattern('^(?=.*)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$')]],
      confirm_password: ['', [Validators.required]],
    }, { validator: this.checkIfMatchingPasswords('new_password', 'confirm_password') });
  }
  checkIfMatchingPasswords(passwordKey: string, passwordConfirmationKey: string) {
    return (group: FormGroup) => {
      let passwordInput = group.controls[passwordKey],
        passwordConfirmationInput = group.controls[passwordConfirmationKey];
      if (passwordInput.value !== passwordConfirmationInput.value) {
        return passwordConfirmationInput.setErrors({ notEquivalent: true })
      }
      else {
        return passwordConfirmationInput.setErrors(null);
      }
    }
  }
  changePassword() {
    this.loader.show()
    this.success_message = ''
    this.error_message = ''
    this.requestData = {
      current_password: this.changePasswordForm.controls.current_password.value,
      new_password: this.changePasswordForm.controls.new_password.value
    };

    this.api.postRequest('Brand/changePassword', this.requestData).then(
      (res) => {
        this.loader.hide()
        let bodyData = res.body
        if (res.body.statusCode == 200) {
          this.changePasswordFormButton = false
          this.changePasswordForm.reset()
          this.modalComponent.action({
            modalType: bodyData.status, //success - warning - confirmation - error
            message: bodyData.message, callback: function () { //only for success - warning - error 
              // this.forgotErrorMessage = ''
              // document.getElementById("hideforgot").click();
            }, timer: 2500
          })
          // this.success_message = 'Password changed successfully'

        } else {
          this.error_message = res.body.message
        }
      },
      (err) => {
      }
    );


  }
  s
}
