import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SnotifyService } from 'ng-snotify'
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { SocketIoService } from './../socket-io.service'
import { Element } from '@angular/compiler';
import { LoaderService } from './../loader/loader-service'
import { ModalComponent } from '../modal/modal.component'

@Component({
  selector: 'app-brand-home',
  templateUrl: './brand-home.component.html',
  styleUrls: ['./brand-home.component.css']
})
export class BrandHomeComponent implements OnInit {

  public singUpErrorMessage: string;
  public forgotErrorMessage: string;
  public forgotSucessMessage: string;
  public singUpSucessMessage: string;
  public singUpApiResponse;
  public singUpformData;
  public typeVisible: string = '1';
  public typeVisible1: string = '1';
  public typeVisibleSignUp: string = '1';
  public formSubmitted: boolean = false;
  public terms_message;

  passError: any
  public loginErrorMessage: string;
  public loginApiResponse;
  public loginformData;
  private currentState;
  private isLoggedInUser;
  public forgotForm: FormGroup;
  public requestData: any;
  emailError: any
  @ViewChild('password')
  private elpassword: ElementRef;
  @ViewChild('confirmPassword')
  public elconfirmPassword: ElementRef;
  @ViewChild('loginPassword')
  private elpassword1: ElementRef;
  @ViewChild('modalComponentHome')
  modalComponent: ModalComponent;

  constructor(
    private stateChangeService: StateChangeService,
    public _router: Router,
    private appComponent: AppComponent,
    public apiService: ApiCallsService,
    public router: Router,
    public route: ActivatedRoute,
    private loader: LoaderService,
    public fb: FormBuilder,
    public titleService: Title,
    private auth: AuthCheckService) {


  }

  profileData: object = {}
  ngOnInit() {

    this.stateChangeService.stateObservable$.subscribe((data) => {
      this.currentState = data.currentStateURL;
      this.isLoggedInUser = data.isLoggedInUser;
    });
    this.stateChangeService.profileObservable$.subscribe((data) => {
      this.profileData = data;
    });

    this.profileData = this.auth.getUserInfo()

    this.loginformData = {
      email: ['', [Validators.required]],
      password: ''
    }
    this.singUpformData = {
      email: '',
      password: '',
      brandName: '',
      confirmPassword: '',
      termsNConditions: false
    }
    this.forgotFormValidate()
  }
  ngAfterViewInit() {
    // setTimeout(() => {
    //   //console.log(this.appComponent._router.url);
    // }, 2000)
  }

  forgotFormValidate() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern('^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,4})$')]]
    });
  }
  forgotPasswordFunc() {
    this.requestData = {
      email: this.forgotForm.controls.email.value
    };
    if (this.forgotForm.controls.email.value != '') {
      this.loader.show()
      this.apiService.postRequest('Users/forgotPassword', this.requestData).then(
        (res) => {
          this.loader.hide()
          let bodyData = res.body
          if (res.body.statusCode == 200) {
            this.forgotForm.reset();
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message, callback: function () { //only for success - warning - error 
                //console.log("callback function")
                this.forgotErrorMessage = ''
                document.getElementById("hideforgot").click();
              }, timer: 2500
            })
          } else {
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message, callback: function () { //only for success - warning - error 
                // document.getElementById("hideforgot").click();
              }, timer: 2500
            })
            this.forgotSucessMessage = ''
            // this.forgotErrorMessage = bodyData.message

          }
        },
        (err) => {
        }
      );
    } else {
      this.forgotSucessMessage = ''
      this.forgotErrorMessage = 'Please enter email.'
    }
  }

  loginFormSubmit(formData: NgForm, event) {
    event.preventDefault();
    let newFormData = new FormData();
    this.formSubmitted = true;
    this.loginErrorMessage = '';
    if (typeof (formData.value.email) != 'undefined') {
      if (typeof (formData.value.loginPassword) != 'undefined') {
        if (formData.valid) {
          if (typeof (formData.value.email) != 'undefined') {
            newFormData['email'] = formData.value.email;
          }
          if (typeof (formData.value.loginPassword) != 'undefined') {
            newFormData['password'] = formData.value.loginPassword;
          }
          this.loader.show()
          this.apiService.postRequest('Brand/login', JSON.stringify(newFormData)).then(
            (res) => {
              this.loader.hide()
              let bodyData = res.body
              if (bodyData.statusCode == 200) {
                this.auth.setLocalStorageData(bodyData.data, 'userData');
                this.profileData = bodyData.data;
                this.auth.setLocalStorageData({ value: res.headers.get('x-logintoken') }, 'access_token');
                // this.auth.setLocalStorageData({ value: bodyData.data }, 'userInfo');
                document.getElementById("hideLoginPopup").click();
                this.router.navigate(['/dashboard']);
              } else {
                this.modalComponent.action({
                  modalType: bodyData.status, //success - warning - confirmation - error
                  message: bodyData.message, callback: function () { //only for success - warning - error 
                    //console.log("callback function")
                    document.getElementById("hideSignUp").click();
                  }, timer: 2500
                })
                // this.loginErrorMessage = bodyData.message
              }
            }, (err) => {
              //console.log("err", err)
            }
          );

        }
      } else {
        this.passError = "Password is required."
      }
    } else {
      this.emailError = "Email is required."
    }

  }



  signUpFormSubmit(formData: NgForm, event) {
    event.preventDefault();
    let newFormData = new FormData();
    this.singUpErrorMessage = ''
    this.singUpSucessMessage = ''
    if (formData.value.email != '' && formData.value.brandName != '' && formData.value.password != '') {
      if (formData.valid) {
        if (typeof (formData.value.email) != 'undefined') {
          newFormData['email'] = formData.value.email;
        }
        if (typeof (formData.value.brandName) != 'undefined') {
          newFormData['brandName'] = formData.value.brandName;
        }
        if (typeof (formData.value.password) != 'undefined') {
          newFormData['password'] = formData.value.password;
        }
        this.loader.show()
        this.apiService.postRequest('Brand/signUp', JSON.stringify(newFormData)).then(
          (res) => {
            this.loader.hide()
            let bodyData = res.body
            if (bodyData.statusCode == 200) {//console.log("asucccsss popup")
              this.modalComponent.action({
                modalType: bodyData.status, //success - warning - confirmation - error
                hasOkayButton: true, // allows modal to stay until user clicks the ok button
                message: bodyData.message, callback: function () { //only for success - warning - error 
                  // //console.log("callback function")
                  document.getElementById("hideSign").click();
                }
              })
            } else {
              this.modalComponent.action({
                modalType: bodyData.status, //success - warning - confirmation - error
                message: bodyData.message, callback: function () { //only for success - warning - error 
                  //console.log("callback function")
                }, timer: 2500
              })
            }
          }, (err) => {
            //console.log("err", err)
          }
        );
      } else {
        if (typeof (formData.value.confirmPassword) == 'undefined') {
          this.singUpErrorMessage = "Please enter confirm password."
        }
      }
    } else {
      this.singUpErrorMessage = "All fields are required."
    }
  }

  checkTerms() {
    if (this.singUpformData.termsNConditions == false) {
      this.terms_message = 'Confirm terms and condition.'
    } else {
      this.terms_message = ''
    }
  }
  toggleVisibility() {
    if (this.singUpformData.password && this.singUpformData.password.value != "") {
      if (this.elpassword.nativeElement.type == 'password') {
        this.typeVisibleSignUp = '2'
        this.elpassword.nativeElement.type = 'text';
      } else {
        this.typeVisibleSignUp = '1'
        this.elpassword.nativeElement.type = 'password';
      }
    }
  }
  toggleConfirmVisibility() {
    if (this.singUpformData.confirmPassword && this.singUpformData.confirmPassword.value != "") {
      if (this.elconfirmPassword.nativeElement.type == 'password') {
        this.typeVisible1 = '2'
        this.elconfirmPassword.nativeElement.type = 'text';
      } else {
        this.typeVisible1 = '1'
        this.elconfirmPassword.nativeElement.type = 'password';
      }
    }
  }
  toggleVisibilityLogin() {
    if (this.loginformData.password.value != "") {//console.log("------------",this.elpassword1.nativeElement.type,this.typeVisible)
      if (this.elpassword1.nativeElement.type == 'password') {
        this.typeVisible = '2'
        this.elpassword1.nativeElement.type = 'text';
      } else {
        this.typeVisible = '1'
        this.elpassword1.nativeElement.type = 'password';
      }
    }
  }

}
