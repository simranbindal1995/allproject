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
  selector: 'app-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss']
})
export class PhotosComponent implements OnInit {

  public followerMedia: any 
  public timeline
  public totalCount
  public sub: any
  public user_id: string
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {
    this.sub = this.route.params.subscribe(params => {
      this.user_id = params['id'];
      //console.log(" = ", this.user_id)
      if (this.user_id)
        this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
    });
  }

  ngOnInit() {
    this.getFollowerMedia()
  }
  getFollowerMedia() {
    this.loader.show()
    this.apiService.getRequest('Brand/followerMedia?user_id=' + this.user_id + '&skip=0&limit=10').then(
      (res) => {
        this.loader.hide()
        let bodyData = res; 
        if (bodyData.statusCode == 200) {
          this.followerMedia = bodyData.data
          this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
}

