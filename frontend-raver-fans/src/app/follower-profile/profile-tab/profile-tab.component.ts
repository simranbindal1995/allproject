import { Component, OnInit, AfterViewInit, TemplateRef } from '@angular/core';
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

@Component({
  selector: 'app-profile-tab',
  templateUrl: './profile-tab.component.html',
  styleUrls: ['./profile-tab.component.scss']
})
export class ProfileTabComponent implements OnInit, AfterViewInit {
  sub: any
  user_id: string
  followerProfile: Boolean
  getFollowerData: any
  fansProfile: Boolean = false
  timelinePostData: any
  image: any
  selected: any
  commentListData
  constructor(private stateChangeService: StateChangeService,
    private loader: LoaderService, private auth: AuthCheckService,
    private capitalize: CapitalizefirstPipe, private toMediaUrl: ToMediaUrlPipe,
    private fb: FormBuilder, private http: HttpClient,
    private apiService: ApiCallsService, private router: Router, private activeRoute: ActivatedRoute) {


    this.stateChangeService.followerObservable$.subscribe((data: any) => {
      console.log("data")
      this.user_id = data.followerId
      if (this.router.url == "/follower/profile/" + this.user_id) {
        this.followerProfile = true;
        //   this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
        this.classToAdd = "float-right post_left"
      } else
        if (this.router.url == "/fans/profile/" + this.user_id) {
          this.fansProfile = true;
          this.classToAdd = "float-right post_left"
          let url = this.router.url;
          this.selected = url.substring(url.indexOf("fans/"), url.lastIndexOf("/"))
          //   this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
        }

      this.getTimeline(true);
    });



  }

  profileData: object = {};
  fanList: Array<object> = [];
  classToAdd: string = "float-left post_left"

  brandInfo: any = {};
  ngOnInit() {
    // this.classToAdd = "float-left post_left"
    this.sub = this.activeRoute.params.subscribe(params => {
      this.user_id = params["id"]
      this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
    });
    this.brandInfo = this.auth.getUserInfo()
    if (this.brandInfo.profile_pic) {
      this.image = this.brandInfo.profile_pic;
    } else {
      this.image = ''
    }
    TagInputModule.withDefaults({
      tagInput: {
        placeholder: 'Whom you are with?',
      }
    });




    this.profileData = this.auth.getUserInfo()

    this.stateChangeService.profileObservable$.subscribe((data) => {
      this.profileData = data;
    });
    if (this.router.url == "/brand/profile") {
      this.followerProfile = false;
      this.classToAdd = "float-right post_left"
    } else if (this.router.url == "/dashboard/raveline") {
      this.followerProfile = false;
      this.classToAdd = "float-left post_left"
    } else if (this.router.url == "/follower/profile/" + this.user_id) {
      this.followerProfile = true;
      this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
      this.classToAdd = "float-right post_left"
    } else if (this.router.url == "/fans/profile/" + this.user_id) {
      this.fansProfile = true;
      this.classToAdd = "float-right post_left"
      this.stateChangeService.followerIdUpdated({ followerId: this.user_id });
    }
    else {
      //console.log('\n\n\nno url matched')
    }

    this.getTimeline(true);

    if (this.followerProfile == false) {
      this.getFanList();
      this.createCompleteProfileForm();
    }
  }
  ngAfterViewInit() {
  }
  addTagsBoolean: boolean = false;
  selectedPost: any = {};
  timelinePosts: Array<any> = [];
  totalPosts: number = 0;
  timelinePostsSkip: any = 0;
  timelinePostsLimit: any = 20;


  onActivate(event) {
    let url = this.router.url;
    this.selected = url.substring(url.indexOf("follower/"), url.lastIndexOf("/"))
    if (this.fansProfile == true) {
      this.selected = url.substring(url.indexOf("fans/"), url.lastIndexOf("/"))
    }
  }

  getTimeline(resetSkipLimit) {
    if (resetSkipLimit) {
      this.timelinePostsSkip = 0;
      this.timelinePostsLimit = 20;
      this.timelinePosts = [];
    }
    this.loader.show();

    if (this.followerProfile == true || this.fansProfile == true) {
      var api_url = 'Brand/followerDetail?user_id=' + this.user_id + '&skip=' + this.timelinePostsSkip + '&limit=' + this.timelinePostsLimit
    } else {
      var api_url = 'Brand/getTimeline?skip=' + this.timelinePostsSkip + '&limit=' + this.timelinePostsLimit
    }
    if (api_url.indexOf('undefined') < 0)
      this.apiService.getRequest(api_url).then(
        (res) => {
          this.loader.hide();
          if (res.statusCode == 200) {
            if (resetSkipLimit) {
              this.timelinePostsSkip = 0;
              this.timelinePostsLimit = 20;
              this.timelinePosts = [];
            }
            let timelineData = []
            if (this.followerProfile == false) {
              timelineData = res.data
            } else if (this.followerProfile == true || this.fansProfile == true) {
              timelineData = res.data.timeline
              this.getFollowerData = res.data

            }
            this.timelinePostData = timelineData
            // if (timelineData.length > 0) {
            timelineData.forEach((element, key) => {
              if (element.Comments) {
                element.Comments = element.Comments.reverse();
                element.createdBy = element.created_by ? (this.capitalize.transform(element.created_by.userName)) : ''
                element.firstTag = element.tag ? (element.tag.length ? ' <div class="with"> with </div>  ' + this.capitalize.transform((element.tag[0].userName)) : '') : ''
                element.otherTags = element.tag.length > 1 ? ' and ' + (element.tag.length - 1) + ' others' : ''
                element.otherTaggedNames = []
                if (element.tag.length > 1) {
                  element.tag.forEach((element1, key1) => {
                    if (key1 > 0) {
                      element.otherTaggedNames.push(element1)
                    }
                  });
                }
              }
            });
            // }
            this.timelinePosts.push(...timelineData);
            //console.log(this.timelinePosts)
            this.totalPosts = res.count;
            this.timelinePostsSkip += this.timelinePostsLimit
          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
  }

  getProfile(data) {
    document.getElementById("viewPostModalCloseButton").click();
    this.apiService.getRequest('Users/getRole?user_id=' + data._id).then(
      (res) => {
        // console.log("==========asd", data, "\n\nres------", res)
        this.loader.hide();
        let bodyData = res
        if (res.statusCode == 200) {
          if (bodyData.data.role == 2) {
            this.router.navigate(["/brands/profile", data._id])
          } else if (bodyData.data.role == 1) {
            this.router.navigate(["/fans/profile", data._id])
          }

        } else {
        }
      }, (err) => {
        ////console.log("err", err)
      }
    );
  }

  visitFollowerProfile(created_by) {
    this.router.navigate(["/follower/profile", created_by])
  }
  visitOtherBrandProfile(created_by) {
    this.router.navigate(["/brands/profile", created_by])
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
    this.loader.show();
    this.apiService.getRequest('Rave/raveDetail?rave_id=' + rave_id + '&skip=' + this.ravePopupCommentsSkip + '&limit=' + this.ravePopupCommentsLimit).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          this.selectedPost = res.data;
          this.timelinePosts.forEach(element => {
            if (element._id == rave_id) {
              element.totalViews = this.selectedPost.totalViews
              console.log("\n\n===============my brand rave status", element.my_brand_rave)
              this.selectedPost.my_brand_rave = element.my_brand_rave
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

  commentText: string = ''
  postComment(rave_id, commentText, index) {
    if (commentText.trim()) {
      // let commentText = commentText;
      //console.log(commentText)
      this.loader.show();
      this.apiService.postRequest('Comment/createComment', { rave_id: rave_id, comment: commentText }).then(
        (res) => {
          this.loader.hide();
          let bodyData = res.body
          if (bodyData.statusCode == 200) {
            let brandInfo = this.auth.getUserInfo()
            var obj = {
              comment: commentText,
              sender_id: { userName: brandInfo.userName },
              created_at: new Date().getTime() / 1000
            }
            if (brandInfo.profile_pic) {
              obj.sender_id['profile_pic'] = brandInfo.profile_pic
            }

            this.ravePopupComments.push(obj)


            // this.ravePopupComments.push({
            //   comment: commentText,
            //   sender_id: this.selectedPost.brand_id,

            //   created_at: new Date().getTime() / 1000
            // })
            this.selectedPost.totalComments += 1
            this.timelinePosts.forEach((element, key) => {
              if (element._id == rave_id) {
                let brandInfo = this.auth.getUserInfo()

                var obj = {
                  comment: commentText,
                  sender_id: { userName: brandInfo.userName },
                  created_at: new Date().getTime() / 1000
                }
                if (brandInfo.profile_pic) {
                  obj.sender_id['profile_pic'] = brandInfo.profile_pic
                }

                this.timelinePosts[key].Comments.push(obj)
                this.timelinePosts[key].totalComments += 1
              }
            });
            // if (index)
            this['commentText' + index] = ''
            this['commentText'] = ''


            setTimeout(() => {
              if (document.getElementById("commentList" + index))
                document.getElementById("commentList" + index).scrollTop = 500 + document.getElementById("commentList" + index).scrollHeight
              if (document.getElementById("commentListInPopup" + index))
                document.getElementById("commentListInPopup" + index).scrollTop = 500 + document.getElementById("commentListInPopup" + index).scrollHeight
            }, 100)

          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
    }
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
        ////console.log("err", err)
      }
    );
  }

  chooseMedia() {
    document.getElementById('fileUpload').click();
  }

  hideDeleteRave(rave_id, isHideRequest) {
    if (isHideRequest) {
      var apiUrl = "Rave/hide"
    } else {
      var apiUrl = "Rave/delete"
    }
    this.apiService.putRequest(apiUrl, { rave_id: rave_id }).then(
      (res) => {
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.timelinePosts.forEach((element, key) => {
            if (element._id == rave_id) {
              this.timelinePosts.splice(key, 1);
            }
          });
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
  getFanList() {
    this.apiService.getRequest('Brand/getFansList?skip=0&limit=10000').then(
      (res) => {
        let bodyData = res
        if (bodyData.statusCode == 200) {
          bodyData.data.forEach(element => {
            element.display = this.capitalize.transform(element.userName)
            element.value = element._id
          });
          this.fanList = bodyData.data;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  fileToUpload: any;
  postImage: string = "";
  postVideo: string = "";
  videoError: boolean = false;
  imageError: boolean = false;
  videoTagElement: HTMLVideoElement;

  handleFileInput(files: FileList) {

    if (files.item(0)) {
      this.videoError = false;
      this.imageError = false;
      this.fileToUpload = files.item(0);
      //console.log(this.fileToUpload.size)
      if ((this.fileToUpload.type.indexOf('image') > -1) || (this.fileToUpload.type.indexOf('video') > -1)) {
        this.loader.show();
        this.apiService.uploadMedia('Files/uploadTmp', this.fileToUpload, (this.fileToUpload.type.indexOf('video') > -1) ? 'true' : 'false', false).then(
          (res) => {
            let bodyData: any;
            bodyData = res;
            if (bodyData.statusCode == 200) {
              if (this.fileToUpload.type.indexOf('image') > -1) {
                if (this.fileToUpload.size > (5 * 125000)) {
                  this.imageError = true;
                  this.loader.hide();
                  return false;
                }
                this.postVideo = ''
                let reader = new FileReader();
                if (this.fileToUpload) {
                  reader.readAsDataURL(this.fileToUpload);
                  reader.onload = () => {
                    this.loader.hide();
                    this.postImage = reader.result;
                  };
                }
                this.savePostForm.patchValue({ picture_id: bodyData.data.fileId });
                this.savePostForm.patchValue({ video_id: "" });
                // this.postImage = bodyData.data.fileId;
              }
              if (this.fileToUpload.type.indexOf('video') > -1) {
                var that = this;
                var video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = function () {
                  that.loader.hide();
                  window.URL.revokeObjectURL(video.src)
                  if (video.duration <= 10 && that.fileToUpload.size > (15 * 125000)) {
                    that.videoTagElement = document.getElementsByTagName('video')[0];
                    if (that.videoTagElement)
                      that.videoTagElement.src = video.src


                    that.postVideo = video.src;
                    that.savePostForm.patchValue({ video_id: bodyData.data.fileId });
                    //that.postVideo = bodyData.data.fileId;
                    that.savePostForm.patchValue({ picture_id: "" });
                    that.postImage = ''
                  } else {
                    that.videoError = true;
                  }
                }
                video.src = URL.createObjectURL(this.fileToUpload);

              }
            } else {
            }
          }, (err) => {
            //console.log("err", err)
          }
        );
      }
    }
  }
  public savePostForm: FormGroup;
  tags: Array<any> = [];
  finalPostData: any = {};
  idForPostToEdit: string = '';
  apiUrl: string = '';
  createCompleteProfileForm() {
    this.savePostForm = this.fb.group({
      description: [''],
      picture_id: [''],
      video_id: [''],
      tag_users: this.fb.array([]),
      file_upload: ['']
    });
  }
  tempTagsArray: Array<any> = [];
  savePostFormSubmitted: boolean = false;

  savePost(event) {
    if ((this.savePostForm.value.description
      || this.savePostForm.value.video_id
      || this.savePostForm.value.picture_id)) {

      this.finalPostData = {};

      if (this.addTagsBoolean) {
        this.tempTagsArray = [];
        this.tags.forEach(element => {
          this.tempTagsArray.push(element['value'])
        })
        if (this.tempTagsArray.length)
          this.finalPostData.tag_users = this.tempTagsArray;
      }

      if (this.savePostForm.value.picture_id)
        this.finalPostData.picture_id = this.savePostForm.value.picture_id;
      if (this.savePostForm.value.video_id)
        this.finalPostData.video_id = this.savePostForm.value.video_id;
      if (this.savePostForm.value.description)
        this.finalPostData.description = this.savePostForm.value.description;

      if (this.idForPostToEdit) {
        this.finalPostData.rave_id = this.idForPostToEdit;
        this.apiUrl = 'Brand/editPost'
      } else {
        this.apiUrl = 'Brand/createPost'
      }
      this.loader.show();

      this.apiService.postRequest(this.apiUrl, this.finalPostData).then(
        (res) => {

          this.loader.hide();
          let bodyData = res.body
          if (bodyData.statusCode == 200) {
            document.getElementById("savePostModalCloseButton").click();
            if (!this.idForPostToEdit) {
              this.getTimeline(true);
            } else {
              this.timelinePosts.forEach((element, key) => {
                if (element._id == this.idForPostToEdit) {
                  delete this.timelinePosts[key].image;
                  delete this.timelinePosts[key].video;
                  for (let innerKey in bodyData.data) {
                    this.timelinePosts[key][innerKey] = bodyData.data[innerKey];
                  }
                }
              });
            }
            this.resetSavePostForm();

          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
    } else {
      //alert("can't share an empty post")
    }
  }

  changeLikeStatus(rave_id, isAlreadyLiked, selectedPost) {
    this.apiService.putRequest("Rave/likeDislike", {
      "type": !isAlreadyLiked ? 1 : 2,
      "rave_id": rave_id
    }).then(
      (res) => {
        this.loader.hide();
        let bodyData = res
        if (bodyData.statusCode == 200) {


          this.timelinePosts.forEach((element, key) => {
            if (element._id == rave_id) {
              if (!isAlreadyLiked) {
                this.timelinePosts[key].already_liked = true;
                this.timelinePosts[key].totalLikes += 1
              } else {
                this.timelinePosts[key].already_liked = false;
                this.timelinePosts[key].totalLikes -= 1
              }
            }
          });
          if (selectedPost) {
            if (!isAlreadyLiked) {
              this.selectedPost.already_liked = true;
              this.selectedPost.totalLikes += 1
            } else {
              this.selectedPost.already_liked = false;
              this.selectedPost.totalLikes -= 1
            }

          }
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
      );
  }


  resetSavePostForm() {
    this.savePostFormSubmitted = false;
    this.postVideo = '';
    this.postImage = '';
    this.idForPostToEdit = '';
    this.tags = [];
    this.savePostForm.reset();
    this.addTagsBoolean = false;
    this.videoError = false;
    this.imageError = false;
  }
  deleteMedia() {
    this.savePostForm.patchValue({ video_id: "" });
    this.savePostForm.patchValue({ picture_id: "" });
    this.postVideo = '';
    this.postImage = '';
    // if (this.idForPostToEdit) {
    //   this.timelinePosts.forEach((element, key) => {
    //     if (element._id == this.idForPostToEdit) {
    //       if (this.timelinePosts[key].image)
    //         delete this.timelinePosts[key].image;
    //       if (this.timelinePosts[key].video)
    //         delete this.timelinePosts[key].video
    //     }
    //   });
    // }
  }


  openPostEditPopup(post) {
    this.savePostForm.reset();
    this.idForPostToEdit = ''
    if (post.video) {
      this.savePostForm.patchValue({ video_id: post.video._id });

      this.savePostForm.patchValue({ picture_id: "" });
      this.postImage = '';
      this.postVideo = this.toMediaUrl.transform(post.video._id);
    } else if (post.image) {
      this.savePostForm.patchValue({ picture_id: post.image._id });
      this.savePostForm.patchValue({ video_id: "" });
      this.postImage = this.toMediaUrl.transform(post.image._id);
      this.postVideo = ''
    } else {
      this.postVideo = ''; this.savePostForm.patchValue({ video_id: "" });
      this.postImage = ''; this.savePostForm.patchValue({ picture_id: "" });
    }

    if (post.tag && post.tag.length) {
      post.tag.forEach(element => {
        element.display = this.capitalize.transform(element.userName)
        element.value = element._id
      });
      this.tags = post.tag
      this.addTagsBoolean = true;
    }
    this.savePostForm.patchValue({ file_upload: '' });
    this.savePostForm.patchValue({ description: post.description });
    this.idForPostToEdit = post._id;
    document.getElementById("savePostModalOpenButton").click()
  }

}
