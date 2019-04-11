import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { ToMediaUrlPipe } from './../pipes/to-media-url.pipe'
import { Element } from '@angular/compiler';
import { ImageCropperComponent, CropperSettings } from 'ng2-img-cropper';
import { LoaderService } from './../loader/loader-service';
import { UniversalFunctionsService } from './../universal-functions.service';
import { ModalComponent } from '../modal/modal.component'

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  customerSupportForm: FormGroup
  requestData: any
  formSubmitted: boolean = false;
  capchaResolved: boolean = false;
  warning: string
  hidePostLoginFooter: boolean
  @ViewChild('modalComponentRequestSupport')
  modalComponent: ModalComponent;

  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent, //private modalService: ModalService,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder, private toMediaUrl: ToMediaUrlPipe,
    public route: ActivatedRoute, private loader: LoaderService,
    private auth: AuthCheckService, private universalFunctions: UniversalFunctionsService, ) { }

  ngAfterViewInit() {
    if (this.router.url == "/contact-us") {
      this.scrollToContactUs();

    }
    if (this.auth.isLoggedIn()) {
      this.hidePostLoginFooter = true
    }
  }

  ngOnInit() {
    this.customerSupportForm = this.fb.group({
      emailField: ['', [Validators.required, this.noWhitespaceValidator, Validators.pattern('^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,4})$')]],
      query: ['', [Validators.required]],
      recaptcha: new FormControl('', [Validators.required])
    })
  }

  resolved(captchaResponse: string) {
    console.log(`Resolved captcha with response ${captchaResponse}:`);
    // this.capchaResolved = true;
  }
  public noWhitespaceValidator(control: FormControl) { let isWhitespace = (control.value || '').trim().length === 0; let isValid = !isWhitespace; return isValid ? null : { 'whitespace': true } }

  scrollToContactUs() {
    var offset = document.getElementById("contactUs")
    window.scrollBy(offset.offsetLeft, offset.offsetTop + 100);
  }

  customerSupport() {
    this.warning = ''
    this.loader.show()
    this.requestData = {
      email: this.customerSupportForm.controls.emailField.value,
      message: this.customerSupportForm.controls.query.value,
    }
    this.apiService.postRequest('Brand/contactUs', this.requestData).then(
      (res) => {
        this.loader.hide()
        let bodyData = res.body
        if (bodyData.statusCode == 200) {
          this.formSubmitted = false
          this.customerSupportForm.reset()
          // this.capchaResolved = false
          this.modalComponent.action({
            modalType: bodyData.status, //success - warning - confirmation - error
            message: bodyData.message, callback: function () { //only for success - warning - error 
            }, timer: 2500
          })

        } else {
          this.modalComponent.action({
            modalType: bodyData.status, //success - warning - confirmation - error
            message: bodyData.message, callback: function () { //only for success - warning - error 
            }, timer: 2500
          })
        }
      }, (err) => {
      }
    );
  }
}
