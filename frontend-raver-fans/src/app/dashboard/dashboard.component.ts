import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';
import { ApiCallsService } from './../api-calls.service';
import { UniversalFunctionsService } from './../universal-functions.service'
import { StateChangeService } from './../stateChange.service'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoaderService } from './../loader/loader-service';

import { Router } from '@angular/router';
import { ImageCropperComponent, CropperSettings } from 'ng2-img-cropper';

import { Observable } from 'rxjs';
import { ModalComponent } from '../modal/modal.component'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isCollapsed = true;
  data: any;
  cropperSettings: CropperSettings;
  cropperSettingsForCoverImage: CropperSettings;
  @ViewChild('modalComponentDashboard')
  modalComponent: ModalComponent;

  @ViewChild('cropper', undefined)
  cropper: ImageCropperComponent;

  @ViewChild('cropperCover', undefined)
  cropperCover: ImageCropperComponent;
  public inviteEmailForm: FormGroup
  inviteErrorPopUp: string
  inviteSuccessPopUp: string
  public brandProfileForm: FormGroup;
  private interestList;
  brandProfileFormSubmitted: boolean = false;


  constructor(private auth: AuthCheckService, private router: Router,
    private stateChangeService: StateChangeService, private loader: LoaderService, private universalFunctions: UniversalFunctionsService, private fb: FormBuilder, private apiService: ApiCallsService) {

    this.cropperSettings = new CropperSettings();
    this.cropperSettings.noFileInput = true;
    this.cropperSettings.keepAspect = true;
    this.cropperSettings.width = 200;
    this.cropperSettings.height = 200;
    this.cropperSettings.croppedWidth = 200;
    this.cropperSettings.croppedHeight = 200;
    this.cropperSettings.canvasWidth = 200;
    this.cropperSettings.canvasHeight = 200;

    this.croppedImage = {};

    this.cropperSettingsForCoverImage = new CropperSettings();
    this.cropperSettingsForCoverImage.noFileInput = true;
    this.cropperSettingsForCoverImage.keepAspect = true;
    this.cropperSettingsForCoverImage.width = 450;
    this.cropperSettingsForCoverImage.height = 180;
    this.cropperSettingsForCoverImage.croppedWidth = 740;
    this.cropperSettingsForCoverImage.croppedHeight = 290;
    this.cropperSettingsForCoverImage.canvasWidth = 740;
    this.cropperSettingsForCoverImage.canvasHeight = 290;
  }

  ngOnInit() {
    this.createCompleteProfileForm();
    this.inviteEmail();
    // this.profile_pic_path = this.profile_pic_path ? this.profile_pic_path : "profile_img.f7d28a814a2d3eb0d1ba.png"
    // this.cover_pic_path = this.cover_pic_path ? this.cover_pic_path : "info_bg.68696126376c6d3beba1.jpg"
  }

  ngAfterViewInit() {
    this.getInterestList();
    this.getProfileData();
    this.auth.isUserProfileComplete();
  }

  createCompleteProfileForm() {
    this.brandProfileForm = this.fb.group({
      brand_url: ['', [Validators.pattern(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/)]], // 
      phone_number: ['', [Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im)]],
      brand_description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      address: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }
  inviteEmail() {
    this.inviteEmailForm = this.fb.group({
      invitationEmails: ['', [Validators.required]]
    })
  }
  profileData: object = {};
  getProfileData() {
    this.apiService.getRequest('Brand/myProfile?skip=0&limit=10').then(
      (res) => {
        // this.loader.hide();
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.auth.setLocalStorageData(res.data.my_profileData, 'userData');
          this.profileData = bodyData.data.my_profileData;

          this.stateChangeService.profileUpdated(this.profileData);
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
  logout() {
    this.apiService.postRequest('Users/logout', null).then(
      (res) => {
        localStorage.removeItem('userData'); localStorage.removeItem('access_token');
        this.router.navigate(['/landing']);
        return true;
      },
      (err) => {
        localStorage.removeItem('userData'); localStorage.removeItem('access_token');
        return true;
      }

    );
  }

  getInterestList() { // used for category dropdown in complete profile
    // this.loader.show();
    this.apiService.getRequest('Admin/Interest/getAll?skip=0&limit=10000').then(
      (res) => {
        // this.loader.hide();
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.interestList = bodyData.data;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  imageChangedEvent: any = '';
  croppedImage: any = {}
  cropperReady: boolean = false;
  isCoverImage: boolean = false;
  imagePath: string;
  profile_pic: string;
  profile_pic_path: string;
  cover_pic_path: string;
  cover_pic: string;
  aspectRatio: number = 1
  resultantWidth: number = 200

  fileChangeListener($event, isCoverImage) {
    this.loader.show();
    this.cropperReady = false;
    var image: any = new Image();
    var file: File = $event.target.files[0];
    var myReader: FileReader = new FileReader();
    var that = this;
    myReader.onloadend = function (loadEvent: any) {
      image.src = loadEvent.target.result;
      that.isCoverImage = isCoverImage
      if (isCoverImage) {
        that.cropperCover.setImage(image);
      } else {
        that.cropper.setImage(image);
      }
      document.getElementById("imageCropperModalShowButton").click();
      that.cropperReady = true;
      that.loader.hide();
    };
    myReader.readAsDataURL(file);
  }
  setProfilePic() {
    this.loader.show();
    this.imagePath = this.croppedImage.image;
    let file = this.universalFunctions.dataURLtoFile(this.imagePath, 'image.jpg')
    this.apiService.uploadMedia('Files/uploadTmp', file, 'false', false).then(
      (res) => {
        this.loader.hide();
        let bodyData: any;
        bodyData = res;

        if (bodyData.statusCode == 200) {
          document.getElementById("imageCropperModalHideButton").click();

          if (this.isCoverImage) {
            this.cover_pic = bodyData.data.fileId;
            this.cover_pic_path = this.croppedImage.image;
            // this.profile_pic_path = "http://ravefandev.ignivastaging.com:8048/v1/Files/"+bodyData.data.fileId+"?thumbnail=false";
          } else {
            this.profile_pic = bodyData.data.fileId;
            this.profile_pic_path = this.croppedImage.image;
            // this.profile_pic_path = "http://ravefandev.ignivastaging.com:8048/v1/Files/"+bodyData.data.fileId+"?thumbnail=false";
          }
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  saveProfile() {
    if (this.brandProfileForm.valid) {
      let formData = this.brandProfileForm.value;
      formData.profile_pic = this.profile_pic
      formData.cover_pic = this.cover_pic
      formData.category = [formData.category + ""]
      this.apiService.putRequest('Brand/completeProfile', formData).then(
        (res) => {
          let bodyData = res;
          if (bodyData.statusCode == 200) {
            this.getProfileData();
            document.getElementById("completeProfileModalHideButton").click();
            // document.getElementById("bankDetailsModalShowButton").click();

          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
    }
  }
  private verifyEmailFormat(tag) {
    if (tag.value.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,})$/) ? false : true) {
      return {
        'verifyEmailFormat': false
      };
    }
    return null;
  }
  public validators = [this.verifyEmailFormat];

  public errorMessages = {
    'verifyEmailFormat': 'Please enter a valid email.',
  };

  sendInvite() {
    let that = this;
    setTimeout(function () {
      if (that.inviteEmailForm.controls.invitationEmails.value) {
        that.apiService.postRequest('Users/inviteFriends', { email: that.inviteEmailForm.controls.invitationEmails.value }).then(
          (res) => {
            let bodyData = res.body;
            if (bodyData.statusCode == 200) {
              that.modalComponent.action({
                modalType: bodyData.status,
                message: 'Invite sent successfully.', callback: function () {
                  document.getElementById("hideInvitePopUp").click();
                }, timer: 2500
              })
            } else {
              that.modalComponent.action({
                modalType: bodyData.status,
                message: bodyData.status.message, callback: function () {
                }, timer: 2500
              })
            }
          }, (err) => {
            //console.log("err", err)
          }
        );
      }
    }, 500)

  }

  confirmLogout() {
    this.modalComponent.action({
      modalType: "confirmation",
      message: "Are you sure you want to logout of system?"
    })
  }
}
