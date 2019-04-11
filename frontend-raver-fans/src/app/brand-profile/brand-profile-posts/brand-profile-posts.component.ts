import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { AuthCheckService } from './../../auth-check.service'
import { Observable } from 'rxjs/Observable';
import { TagInputModule } from 'ngx-chips';
import { HttpClient } from '@angular/common/http';
import { ApiCallsService } from './../../api-calls.service';
import { CapitalizefirstPipe } from './../../pipes/capitalizefirst.pipe'
import { ToMediaUrlPipe } from './../../pipes/to-media-url.pipe'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { element } from 'protractor';
import { LoaderService } from './../../loader/loader-service'
import { StateChangeService } from './../../stateChange.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CeiboShare } from 'ng2-social-share';
import { ModalComponent } from '../../modal/modal.component'
import { ShareButtons } from '@ngx-share/core';


@Component({
  selector: 'app-brand-profile-posts',
  templateUrl: './brand-profile-posts.component.html',
  styleUrls: ['./brand-profile-posts.component.css']
})
export class BrandProfilePostsComponent implements OnInit {

  sub: any
  user_id: string
  followerProfile: Boolean = false
  getFollowerData: any
  post_id: any
  commentListData: any
  totalCount: any
  image: any
  constructor(private stateChangeService: StateChangeService,
    private loader: LoaderService, private auth: AuthCheckService,
    private capitalize: CapitalizefirstPipe, private toMediaUrl: ToMediaUrlPipe,
    private fb: FormBuilder, private http: HttpClient, public share: ShareButtons,
    private apiService: ApiCallsService, private router: Router, private activeRoute: ActivatedRoute) {
    // this.activeRoute.params.subscribe(params => {
    //   this.user_id = params['id'];
    //   if (this.user_id)
    //     this.stateChangeService.brandIdUpdated({ brandId: this.user_id });
    // });

    // this.user_id = this.router.url.substring(this.router.url.lastIndexOf('/') + 1, this.router.url.length)


    // this.stateChangeService.brandIdUpdated({ brandId: this.user_id });


    //console.log(this.router.url)
  }

  profileData: object = {};
  fanList: Array<object> = [];
  classToAdd: string = "float-left post_left"





  ngOnInit() {
    let brandInfo = this.auth.getUserInfo()
    if (brandInfo.profile_pic) {
      this.image = brandInfo.profile_pic;
    } else {
      this.image = ''
    }
    this.sub = this.activeRoute.params.subscribe(params => {
      this.user_id = params["id"]
    });
    this.profileData = this.auth.getUserInfo()

    this.stateChangeService.profileObservable$.subscribe((data) => {
      this.profileData = data;
    });


    this.getTimeline(true);

  }
  ngAfterViewInit() {
    //this.getTimeline(true);
  }
  addTagsBoolean: boolean = false;
  selectedPost: any = {};
  timelinePosts: Array<any> = [];
  totalPosts: number = 0;
  timelinePostsSkip: any = 0;
  timelinePostsLimit: any = 20;

  getTimeline(resetSkipLimit) {

    //console.log("get timeline Inder")
    if (resetSkipLimit) {
      this.timelinePostsSkip = 0;
      this.timelinePostsLimit = 20;
      this.timelinePosts = [];
    }
    this.loader.show();
    var api_url = 'Brand/getBrandProfile?brand_id=' + this.user_id + '&limit=' + this.timelinePostsLimit

    this.apiService.getRequest(api_url).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {

          // this.profileData = res.data.my_profileData;
          let timelineData = []
          timelineData = res.data.my_timelineData;

          timelineData.forEach((element, key) => {
            if (element.Comments)
              element.Comments = element.Comments.reverse();
            element.main = element.created_by ? (this.capitalize.transform(element.created_by.userName)) + " " +
              (element.tag ? (element.tag.length ? (element.tag.length > 1 ?
                ' with ' + this.capitalize.transform((element.tag[0].userName)) + ' and ' + (element.tag.length - 1) + ' others' : ' with ' + this.capitalize.transform((element.tag[0].userName))
              ) : '') : '') : ''

          });

          this.timelinePosts.push(...timelineData);
          this.totalPosts = res.count;
          this.timelinePostsSkip += this.timelinePostsLimit
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  ravePopupComments: Array<any> = [];
  ravePopupCommentsSkip: any = 0;
  ravePopupCommentsLimit: any = 5;

  getRaveDetails(rave_id, resetCommentsArray) {
    if (resetCommentsArray) {
      this.ravePopupComments = [];
      this.ravePopupCommentsSkip = 0
      this.ravePopupCommentsLimit = 4
    }
    this.post_id = rave_id
    this.loader.show();
    this.apiService.getRequest('Rave/raveDetail?rave_id=' + rave_id + '&skip=' + this.ravePopupCommentsSkip + '&limit=' + this.ravePopupCommentsLimit).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          this.selectedPost = res.data;
          this.timelinePosts.forEach(element => {
            if (element._id == rave_id) {
              element.totalViews = this.selectedPost.totalViews
            }
          });
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

  commentList(rave_id, index) {
    this.apiService.getRequest('Comment/getCommentList?rave_id=' + rave_id + '&skip=0&limit=100000').then(
      (res) => {
        this.loader.hide();
        let bodyData = res
        if (res.statusCode == 200) {
          this.timelinePosts[index].Comments = bodyData.data.reverse();
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }


}
