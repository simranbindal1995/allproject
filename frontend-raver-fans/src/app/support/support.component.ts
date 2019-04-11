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
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {
  customerSupportForm: FormGroup
  requestData: any
  formSubmitted: boolean = false;
  @ViewChild('modalComponentRequestSupport')
  modalComponent: ModalComponent;
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent, //private modalService: ModalService,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder, private toMediaUrl: ToMediaUrlPipe,
    public route: ActivatedRoute, private loader: LoaderService,
    private auth: AuthCheckService, private universalFunctions: UniversalFunctionsService, ) { }

  ngOnInit() {
    this.customerSupportForm = this.fb.group({
      queryType: ['', [Validators.required]],
      query: ['', [Validators.required]],
    })
  }
  customerSupport() {
    if (this.customerSupportForm.valid && this.customerSupportForm.controls.query.value.trim()) {
      this.loader.show()
      this.requestData = {
        subject_type: this.customerSupportForm.controls.queryType.value,
        message: this.customerSupportForm.controls.query.value,
      }
      this.apiService.postRequest('Brand/support', this.requestData).then(
        (res) => {
          this.loader.hide()
          let bodyData = res.body
          if (bodyData.statusCode == 200) {
            this.customerSupportForm.reset()
            this.formSubmitted = false
            this.customerSupportForm.controls.queryType.setValue('4')
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message, callback: function () { //only for success - warning - error 
                //console.log("callback function")
              }, timer: 2500
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
    }else{
      this.modalComponent.action({
        modalType: "warning", //success - warning - confirmation - error
        message: "Please fill the all the fields.",
         callback: function () { //only for success - warning - error 
          //console.log("callback function")
        }, timer: 2500
      })
    }
  }
}
