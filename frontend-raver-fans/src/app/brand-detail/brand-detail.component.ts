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
import { LoaderService } from './../loader/loader-service'
import { Element } from '@angular/compiler';

@Component({
  selector: 'app-brand-detail',
  templateUrl: './brand-detail.component.html',
  styleUrls: ['./brand-detail.component.css']
})
export class BrandDetailComponent implements OnInit {

  getProfileData: any={}
  totalCount: any
  timeLine: any
  constructor(private loader: LoaderService, private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
  ) {
  }
  ngOnInit() {
    this.getProfileDetails()
  }
  getProfileDetails() {
    this.loader.show()
    this.apiService.getRequest('Brand/myProfile?skip=0&limit=10').then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.getProfileData = bodyData.data.my_profileData;
          this.timeLine = bodyData.data.my_timelineData;
          this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
}
