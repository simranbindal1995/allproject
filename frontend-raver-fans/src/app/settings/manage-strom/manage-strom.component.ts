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
@Component({
  selector: 'app-manage-strom',
  templateUrl: './manage-strom.component.html',
  styleUrls: ['./manage-strom.component.css']
})
export class ManageStromComponent implements OnInit {
  stormsData: any
  totalCount: any
  public records_per_page: number;
  public skip: number = 0;
  public limit: number = 10;
  p: number = 1;
  page_number: number = 1;
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {
  }

  ngOnInit() {
    this.getStromsListing()
  }
  getStromsListing() {
    this.loader.show()
    this.apiService.getRequest('Brand/stormList?skip=' + this.skip + '&limit=' + this.limit).then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.stormsData = bodyData.data;
          this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  pageChanged(page) {
    if (page < this.page_number) {
      console.log("\n\npage===", page, "\n\npagenumber", this.page_number,this.skip)
      if (this.skip != 0) {
        this.skip = this.skip - this.limit;
        console.log("=========skip,limit", this.skip, this.limit)
        this.ngOnInit();
      }
      this.page_number = page;
    }
    else if (page > this.page_number) {
      if (this.records_per_page == 10 && this.totalCount > 10) {
        this.skip = this.skip + this.limit;
        console.log("=========skip,limit", this.skip, this.limit)
        this.ngOnInit();
      }
      this.page_number = page;
    }
  }
}
