import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { ApiCallsService } from '../../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from '../../stateChange.service';
import { LoaderService } from '../../loader/loader-service';
import { AppComponent } from '../../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Element } from '@angular/compiler';

@Component({
  selector: 'app-brand-profile-photos',
  templateUrl: './brand-profile-photos.component.html',
  styleUrls: ['./brand-profile-photos.component.css']
})
export class BrandProfilePhotosComponent implements OnInit, AfterViewInit {
  mediaData: any
  totalCount: number
  sub: any
  user_id: string
  fansProfile: Boolean = false
  followerProfilePhotos: Boolean = false
  brandInfo: any
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder, private loader: LoaderService,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private activeRoute: ActivatedRoute
  ) {
  }
  ngOnInit() {
    this.brandInfo = this.auth.getUserInfo()
    
    if (this.router.url == "/fans/profile/", this.user_id) {
      this.fansProfile = true;
    }
  }
  ngAfterViewInit() {
    this.sub = this.activeRoute.params.subscribe(params => {
      this.user_id = params["id"]
    });
    if (this.router.url == "/fans/profile/", this.user_id) {
      this.fansProfile = true;
    }
    if (this.router.url == "/follower/photos/" + this.user_id) {
      this.followerProfilePhotos = true
      this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
    } if (this.router.url == "/fans/profile/", this.user_id) {
      this.followerProfilePhotos = true
      this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
    }
    this.getPhotosData()
  }
  getPhotosData() {
    if (this.followerProfilePhotos == true) {
      var api_url = 'Brand/followerMedia?user_id=' + this.user_id + '&skip=0&limit=10'
    } else {
      var api_url = 'Brand/mediaData?skip=0&limit=10'
    }
    this.apiService.getRequest(api_url).then(
      (res) => {
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.mediaData = bodyData.data;
          this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  selectedPost: any = {};

  ravePopupComments: Array<any> = [];
  ravePopupCommentsSkip: any = 0;
  ravePopupCommentsLimit: any = 5;

  getRaveDetails(rave_id, resetCommentsArray) {
    if (resetCommentsArray) {
      this.ravePopupComments = [];
      this.ravePopupCommentsSkip = 0
      this.ravePopupCommentsLimit = 4
    }
    this.loader.show();
    this.apiService.getRequest('Rave/raveDetail?rave_id=' + rave_id + '&skip=' + this.ravePopupCommentsSkip + '&limit=' + this.ravePopupCommentsLimit).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          this.selectedPost = res.data;
          console.log("\n\n\nselectedPost.my_brand_rave====", this.selectedPost.my_brand_rave)
          this.selectedPost.comments.forEach(element => {
            this.ravePopupComments.unshift(element)
          });


          this.ravePopupCommentsSkip += this.ravePopupCommentsLimit

          document.getElementById("viewPostModalOpenButton").click();
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }


  commentText: string = ''
  postComment(rave_id) {
    if (this.commentText.trim()) {
      this.loader.show();
      this.apiService.postRequest('Comment/createComment', { rave_id: rave_id, comment: this.commentText }).then(
        (res) => {
          this.loader.hide();
          let bodyData = res.body
          if (bodyData.statusCode == 200) {
            this.ravePopupComments.push({
              comment: this.commentText,
              sender_id: this.selectedPost.brand_id
            })
            this.selectedPost.totalComments += 1
            this.commentText = ''
          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
    }
  }



  changeLikeStatus(rave_id, isAlreadyLiked) {
    this.apiService.putRequest("Rave/likeDislike", {
      "type": !isAlreadyLiked ? 1 : 2,
      "rave_id": rave_id
    }).then(
      (res) => {
        this.loader.hide();
        let bodyData = res
        if (bodyData.statusCode == 200) {

          if (!isAlreadyLiked) {
            this.selectedPost.already_liked = true;
            this.selectedPost.totalLikes += 1
          } else {
            this.selectedPost.already_liked = false;
            this.selectedPost.totalLikes -= 1
          }

        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

}
