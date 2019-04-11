import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from './../loader/loader-service'
@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss']
})
export class NotificationsListComponent implements OnInit {
  public notificationData: any=[];
  public totalCount: any;
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
    this.showNotifications(true)
  }
  ravePopupCommentsSkip = 0;
  ravePopupCommentsLimit = 10;
  showNotifications(resetSkipLimit) {
    if (resetSkipLimit) {
      this.ravePopupCommentsSkip = 0;
      this.ravePopupCommentsLimit = 10;
      this.notificationData = [];
    }
    this.apiService.getRequest('notifications/notificationList?skip=' + this.ravePopupCommentsSkip + '&limit=' + this.ravePopupCommentsLimit).then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.notificationData.push(...bodyData.data);
          this.totalCount = bodyData.count;
          this.ravePopupCommentsSkip += this.ravePopupCommentsLimit
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

}
