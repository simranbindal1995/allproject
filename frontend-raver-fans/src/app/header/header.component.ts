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
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  providers: [AppComponent]
})



export class HeaderComponent implements OnInit, AfterViewInit {
  isCollapsed = true;
  public singUpErrorMessage: string;
  public forgotErrorMessage: string;
  public forgotSucessMessage: string;
  public singUpSucessMessage: string;
  public singUpApiResponse;
  public singUpformData;
  public formSubmitted: boolean = false;
  public terms_message;
  public typeVisible: string = '1';
  public typeVisible1: string = '1';
  public typeVisibleSignUp: string = '1';
  public notificationData: any;
  public loginErrorMessage: string;
  public loginApiResponse;
  public loginformData;
  public emailError: string
  private currentState;
  private isLoggedInUser;
  public forgotForm: FormGroup;
  public requestData: any;
  public totalCount: any
  public notificationCount: any
  passError: any
  public messagesCount: any
  emailLoginpattern = "^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,4})$"

  @ViewChild('password')
  private elpassword: ElementRef;

  @ViewChild('confirmPassword')
  public elconfirmPassword: ElementRef;

  @ViewChild('loginPassword')
  private elpassword1: ElementRef;

  @ViewChild('modalComponentHeader')
  modalComponent: ModalComponent;

  searchKeyword = new FormControl();
  searchResults: any = []

  resetHeaderSearch(event) {}

  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,

    private socket: SocketIoService,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    public titleService: Title, private auth: AuthCheckService,
    private snotifyService: SnotifyService,
    private loader: LoaderService) {}

  totalUnreadMessages: any = 0
  profileData: object = {}
  ngOnInit() {

    let that = this;

    this.searchKeyword.valueChanges.debounceTime(200).subscribe(searchKeyword => {
      if (searchKeyword && searchKeyword.trim()) {
        that.apiService.getRequest("Brand/searchFansBrands?searchKeyword=" + searchKeyword + "&skip=0&limit=10").then(
          (res) => {
            if (res.statusCode == 200) {
              that.searchResults = res.data;
            } else {}
          }, (err) => {}
        );
      } else {
        that.searchResults = []
      }
    })



    this.stateChangeService.stateObservable$.subscribe((data) => {
      this.searchKeyword.reset();
      this.currentState = data.currentStateURL;
      this.isLoggedInUser = data.isLoggedInUser;
    });
    this.stateChangeService.profileObservable$.subscribe((data) => {
      this.profileData = data;
    });
    this.stateChangeService.unreadMessagesObservable$.subscribe((data) => {
      that.totalUnreadMessages = data.unreadCount;
    });
    if (localStorage.getItem('access_token')) {
      this.socket.getUnreadMessages({
        "x-logintoken": JSON.parse(localStorage.getItem('access_token')).value
      }, function(data) {
        that.totalUnreadMessages = data.unreadCount;
      })
      this.socket.getNotifications().subscribe((message: any) => {
        that.notificationCount = message.totalNotification
      })
      this.socket.receiveMessage().subscribe((message: any) => {

        that.socket.getUnreadMessages({
          "x-logintoken": JSON.parse(localStorage.getItem('access_token')).value
        }, function(data) {
          that.totalUnreadMessages = data.unreadCount;
        })
        this.socket.messageDelivered({
          'message_id': message._id,
          'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
        }, function(data) {})

      })

    }




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
  ngAfterViewInit() {}
  showTerms() {
    document.getElementById("hideSignUp").click();
  }
  showNotifications() {
    this.apiService.getRequest('notifications/notificationList?skip=0&limit=5').then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.notificationData = bodyData.data;
          this.totalCount = bodyData.count;
          this.notificationCount = 0
        } else {}
      }, (err) => {}
    );
  }
  chats: any = []
  showMessages() {
    this.chats = []
    this.apiService.getRequest("Messages/getInbox").then(
      (res) => {
        if (res.statusCode == 200) {
          this.chats = res.data.splice(0, 4);
          let that = this;
          this.socket.getOnlineUsers().subscribe((users) => {
            that.chats.forEach(chat => {
              users.forEach(user => {
                if (chat._id == user.user_id) {
                  chat.isOnline = true;
                }
              });
            });
          })
        } else {}
      }, (err) => {}
    );
  }

  scrollToContactUs() {
    var offset = document.getElementById("contactUs")
    window.scrollBy(offset.offsetLeft, offset.offsetTop + 100);
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
              message: bodyData.message,
              callback: function() { //only for success - warning - error 
                this.forgotErrorMessage = ''
                document.getElementById("hideforgot").click();
              },
              timer: 2500
            })
          } else {
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message,
              callback: function() { //only for success - warning - error 
              },
              timer: 2500
            })
            this.forgotSucessMessage = ''
          }
        },
        (err) => {}
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
    this.passError = '';
    this.emailError = ''
    if (formData.valid) {
      if (typeof(formData.value.email) != 'undefined') {
        newFormData['email'] = formData.value.email;
      }
      if (typeof(formData.value.loginPassword) != 'undefined') {
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
            this.notificationCount = 0
            this.auth.setLocalStorageData({ value: res.headers.get('x-logintoken') }, 'access_token');
            this.socket.checkConnection() // calling socket connection event 
            document.getElementById("hideLoginPopup").click();
            this.router.navigate(['/dashboard']);
          } else {
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message,
              callback: function() { //only for success - warning - error 
                document.getElementById("hideSignUp").click();
              },
              timer: 2500
            })
          }
        }, (err) => {}
      );
    }

  }



  signUpFormSubmit(formData: NgForm, event) {

    event.preventDefault();
    let newFormData = new FormData();
    this.singUpErrorMessage = ''
    this.singUpSucessMessage = ''
    if (formData.value.email != '' && formData.value.brandName != '' && formData.value.password != '') {
      if (formData.valid) {
        if (typeof(formData.value.email) != 'undefined') {
          newFormData['email'] = formData.value.email;
        }
        if (typeof(formData.value.brandName) != 'undefined') {
          newFormData['brandName'] = formData.value.brandName;
        }
        if (typeof(formData.value.password) != 'undefined') {
          newFormData['password'] = formData.value.password;
        }
        this.loader.show()
        this.apiService.postRequest('Brand/signUp', JSON.stringify(newFormData)).then(
          (res) => {
            this.loader.hide()
            let bodyData = res.body
            if (bodyData.statusCode == 200) {
              this.notificationCount = 0
              this.modalComponent.action({
                modalType: bodyData.status, //success - warning - confirmation - error
                hasOkayButton: true, // allows modal to stay until user clicks the ok button
                message: bodyData.message,
                callback: function() { //only for success - warning - error 
                  document.getElementById("hideSignUp").click();
                }
              })
            } else {
              this.modalComponent.action({
                modalType: bodyData.status, //success - warning - confirmation - error
                message: bodyData.message,
                callback: function() { //only for success - warning - error 
                },
                timer: 2500
              })
            }
          }, (err) => {}
        );
      } else {
        if (typeof(formData.value.confirmPassword) == 'undefined') {
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
    console.log('SignUp eye=============') // HERE
    if (this.singUpformData.password && this.singUpformData.password.value != "") {
      console.log('Ij if===', this.elpassword)
      if (this.elpassword.nativeElement.type == 'password') {
        console.log('1')
        this.typeVisibleSignUp = '2'
        this.elpassword.nativeElement.type = 'text';
      } else {
        console.log('2')
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
    if (this.loginformData.password.value != "") {
      console.log('login=======', this.elpassword1)
      if (this.elpassword1.nativeElement.type == 'password') {
        this.typeVisible = '2'
        this.elpassword1.nativeElement.type = 'text';
      } else {
        this.typeVisible = '1'
        this.elpassword1.nativeElement.type = 'password';
      }
    }
  }

  logout() {
    this.loader.show()
    this.apiService.postRequest('Users/logout', null).then(
      (res) => {
        this.loader.hide()
        this.socket.disconnect({ // disconnect socket event
          'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
        }, function(data) {})

        localStorage.removeItem('userData');
        localStorage.removeItem('access_token');
        this.router.navigate(['/landing']);
        return true;
      },
      (err) => {
        localStorage.removeItem('userData');
        localStorage.removeItem('access_token');
        return true;
      }

    );
  }

  viewProfile(user) {
    if (user.role == 2) {
      this.router.navigate(["/brands/profile", user._id])
    } else if (user.role == 1) {
      this.router.navigate(["/fans/profile", user._id])
    }
  }

  confirmLogout() {
    this.modalComponent.action({
      modalType: "confirmation",
      message: "Are you sure you want to logout of system?"
    })
  }

}
