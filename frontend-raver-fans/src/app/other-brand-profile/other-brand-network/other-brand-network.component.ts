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
  selector: 'app-other-brand-network',
  templateUrl: './other-brand-network.component.html',
  styleUrls: ['./other-brand-network.component.scss']
})
export class OtherBrandNetworkComponent implements OnInit {
  followers: any
  totalCount: any
  timeLine: any
  public records_per_page: number;
  public skip: number = 0;
  public limit: number = 10;
  sub: any
  user_id: string
  followerProfileFollwers: Boolean = false
  p: number = 1;
  page_number: number = 1;
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private activeRoute: ActivatedRoute
  ) {
  }

  ngOnInit() {
  }
  ngAfterViewInit() {
    this.sub = this.activeRoute.params.subscribe(params => {
      this.user_id = params["id"]
      this.stateChangeService.brandIdUpdated({ brandId: this.user_id });
    });
  
    this.getProfileDetails()
  }
  getProfileDetails() {
    var api_url = 'Brand/brandFansList?brand_id=' + this.user_id + '&skip=0&limit=10'

    this.apiService.getRequest(api_url).then(
      (res) => {
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.followers = bodyData.data
          this.totalCount = bodyData.count;



          //console.log(this.followers)
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  pageChanged(page) {
    if (page < this.page_number) {
      if (this.skip != 0) {
        this.skip = this.skip - this.limit;
        this.ngOnInit();
      }
      this.page_number = page;
    }
    else if (page > this.page_number) {
      if (this.records_per_page == 10 && this.totalCount > 10) {
        this.skip = this.skip + this.limit;
        this.ngOnInit();
      }
      this.page_number = page;
    }
  }
}
