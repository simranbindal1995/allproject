import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { ToMediaUrlPipe } from './../pipes/to-media-url.pipe'
import { Element } from '@angular/compiler';
import { ImageCropperComponent, CropperSettings } from 'ng2-img-cropper';
import { LoaderService } from './../loader/loader-service';
import { UniversalFunctionsService } from './../universal-functions.service';


@Component({
  selector: 'app-brand-profile',
  templateUrl: './brand-profile.component.html',
  styleUrls: ['./brand-profile.component.css']
})
export class BrandProfileComponent implements OnInit {

  data: any;
  cropperSettings: CropperSettings;
  cropperSettingsForCoverImage: CropperSettings;

  @ViewChild('cropper', undefined)
  cropper: ImageCropperComponent;
  imageChangedEvent: any = '';
  croppedImage: any = {}
  cropperReady: boolean = false;
  isCoverImage: boolean = false;
  profileData: any = {};
  isOtherBrand: boolean;
  brandId: any;
  printDataProfile = "true"
  user_id: any;
  brandInfo: any
  interests: any
  @ViewChild('cropperCover', undefined)
  cropperCover: ImageCropperComponent;
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder, private toMediaUrl: ToMediaUrlPipe,
    public route: ActivatedRoute, private loader: LoaderService,
    private auth: AuthCheckService, private universalFunctions: UniversalFunctionsService,
  ) {

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


    this.stateChangeService.brandObservable$.subscribe((data: any) => {
      //console.log("brand id updated  = = = ", data)
      this.user_id = data.brandId
      this.getProfileDetails();
    });

  }



  public brandProfileForm: FormGroup;
  interestList: any = [];
  category: any = '';
  isEditMode: boolean = false;
  brandProfileFormSubmitted: boolean = false;

  ngOnInit() {
    this.getInterest()
    this.brandInfo = this.auth.getUserInfo()
    this.user_id = this.router.url.substring(this.router.url.lastIndexOf('/') + 1, this.router.url.length)

    if (this.router.url.indexOf('brands') > -1) {
      this.isOtherBrand = true;
    } else {
      this.isOtherBrand = false;
      //console.log("else mai")
      this.getProfileDetails();
    }
    this.createSaveProfileForm();
  }

  profile_pic: any = ""
  cover_pic: any = ""
  imagePath: string;

  getInterest() {
    this.apiService.getRequest('Admin/Interest/getAll?skip=0&limit=10').then(
      (res) => {
        let bodyData = res;
        if (bodyData.statusCode == 200) {
          this.interests = bodyData.data
        } else {}
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  saveProfile(saveOnlyImages) {
    console.log('this.brandProfileForm.valid========', this.brandProfileForm.valid)
    if (this.brandProfileForm.valid) {
      let formData = !saveOnlyImages ? this.brandProfileForm.value : {};
      formData.profile_pic = this.profile_pic
      formData.cover_pic = this.cover_pic

      this.apiService.putRequest('Brand/editProfile', formData).then(
        (res) => {
          let bodyData = res;
          if (bodyData.statusCode == 200) {
            this.isEditMode = false;
            this.auth.setLocalStorageData(res.data, 'userData');
            this.stateChangeService.profileUpdated(res.data);
          } else {}
        }, (err) => {
          //console.log("err", err)
        }
      );
    }
  }



  fileChangeListener($event, isCoverImage) {
    console.log(this.cropper)
    this.loader.show();
    this.cropperReady = false;
    var image: any = new Image();
    var file: File = $event.target.files[0];
    var myReader: FileReader = new FileReader();
    var that = this;
    myReader.onloadend = function(loadEvent: any) {
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
          this.saveProfile(true);
        } else {}
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  createSaveProfileForm() {
    this.brandProfileForm = this.fb.group({
      brand_url: ['', [Validators.pattern(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/)]], // 
      phone_number: ['', [Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im)]],
      brand_description: ['', [Validators.required]],
      // category: ['', [Validators.required]],
      address: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }


  totalCount: any = 0
  profile_pic_path: any = ''
  cover_pic_path: any = ''





  getProfileDetails() {
    let apiUrl;
    if (this.isOtherBrand == true) {
      apiUrl = 'Brand/getBrandProfile?brand_id=' + this.user_id + '&skip=0&limit=10';
    } else {
      apiUrl = 'Brand/myProfile?skip=0&limit=10'
    }

    this.apiService.getRequest(apiUrl).then(
      (res) => {
        let bodyData = res;
        if (bodyData.statusCode == 200) {
          this.profileData = bodyData.data.my_profileData;
          this.category = bodyData.data.my_profileData.interests ? bodyData.data.my_profileData.interests[0].interest_name : '';


          this.profile_pic_path = this.toMediaUrl.transform(bodyData.data.my_profileData.profile_pic)
          this.cover_pic_path = this.toMediaUrl.transform(bodyData.data.my_profileData.cover_pic)
          this.profile_pic = bodyData.data.my_profileData.profile_pic
          this.cover_pic = bodyData.data.my_profileData.cover_pic


          this.brandProfileForm.patchValue({ brand_url: bodyData.data.my_profileData.url ? bodyData.data.my_profileData.url : '' });
          this.brandProfileForm.patchValue({ phone_number: bodyData.data.my_profileData.phone_number ? bodyData.data.my_profileData.phone_number : '' });
          this.brandProfileForm.patchValue({ brand_description: bodyData.data.my_profileData.about_me ? bodyData.data.my_profileData.about_me : '' });
          this.brandProfileForm.patchValue({ address: bodyData.data.my_profileData.address ? bodyData.data.my_profileData.address : '' });
          this.brandProfileForm.patchValue({ country: bodyData.data.my_profileData.country ? bodyData.data.my_profileData.country : '' });
          // this.brandProfileForm.patchValue({ category: bodyData.data.my_profileData.interests ? bodyData.data.my_profileData.interests : '' });
        } else {}
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
}
