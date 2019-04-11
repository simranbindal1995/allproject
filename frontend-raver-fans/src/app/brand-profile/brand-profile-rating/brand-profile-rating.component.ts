import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { ApiCallsService } from '../../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from '../../stateChange.service';
import { AppComponent } from '../../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Element } from '@angular/compiler';

@Component({
  selector: 'app-brand-profile-rating',
  templateUrl: './brand-profile-rating.component.html',
  styleUrls: ['./brand-profile-rating.component.css']
})
export class BrandProfileRatingComponent implements OnInit {
  getRatingData: any
  totalCount: any
  max: number = 5;
  // rate: number = 7;
  isReadonly: boolean = true;

  constructor(private stateChangeService: StateChangeService,
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
    this.apiService.getRequest('Brand/ratingData?skip=0&limit=10').then(
      (res) => {
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.getRatingData = bodyData.data;
          this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

}
