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
  selector: 'app-other-brand-rating',
  templateUrl: './other-brand-rating.component.html',
  styleUrls: ['./other-brand-rating.component.scss']
})
export class OtherBrandRatingComponent implements OnInit {
  getRatingData: any
  totalCount: any
  sub: any
  brand_id: any
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
    this.sub = this.route.params.subscribe(params => {
      this.brand_id = params['id'];
      this.stateChangeService.brandIdUpdated({ brandId: this.brand_id });
      this.getProfileDetails()

    });
  }
  getProfileDetails() {
    this.apiService.getRequest('Brand/brandRatingData?brand_id=' + this.brand_id).then(
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
