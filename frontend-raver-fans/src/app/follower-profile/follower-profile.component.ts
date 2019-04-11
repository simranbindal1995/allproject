import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from '../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from '../stateChange.service';
import { AppComponent } from '../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from '../loader/loader-service'

@Component({
  selector: 'app-follower-profile',
  templateUrl: './follower-profile.component.html',
  styleUrls: ['./follower-profile.component.scss']
})
export class FollowerProfileComponent implements OnInit {

  public followerData: any = {}
  public timeline
  public totalCount
  public sub: any
  fansProfile: Boolean = false
  public user_id: string = ''
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {
    this.stateChangeService.followerObservable$.subscribe((data: any) => {
      this.user_id = data.followerId
      if (this.router.url == "/fans/profile/", this.user_id) {
        this.fansProfile = true;
      }
      this.getFollowerDetail()

    });

  }
  selected: string = ''
  ngOnInit() {
  }
  ngAfterViewInit() {
  }
  onActivate(event) {
    let url = this.router.url;
    this.selected = url.substring(url.indexOf("follower/"), url.lastIndexOf("/"))
    if (this.fansProfile == true) {
      this.selected = url.substring(url.indexOf("fans/"), url.lastIndexOf("/"))
    }
  }
  getFollowerDetail() {
    this.loader.show()
    this.apiService.getRequest('Brand/followerDetail?user_id=' + this.user_id + '&skip=0&limit=10').then(
      (res) => {
        this.loader.hide()
        let bodyData = res;
        if (bodyData.statusCode == 200) {
          this.timeline = bodyData.data.timeline;
          this.followerData = bodyData.data
          this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  initiateChatWithFan() {
    // this.auth.setLocalStorageData({
    //   userName: this.followerData.userName,
    //   first_name: this.followerData.first_name,
    //   last_name: this.followerData.last_name,
    //   profile_pic: this.followerData.profile_pic,
    //   _id: this.followerData._id
    // }, 'initiateChatWithFanData');
    this.router.navigate(['messaging'], { queryParams: { user_id: this.followerData._id } });
    // this.router.navigate(['messaging', this.followerData._id]);
  }
}
