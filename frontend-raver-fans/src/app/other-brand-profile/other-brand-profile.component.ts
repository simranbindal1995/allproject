import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ToMediaUrlPipe } from './../pipes/to-media-url.pipe'
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from './../loader/loader-service'
@Component({
  selector: 'app-other-brand-profile',
  templateUrl: './other-brand-profile.component.html',
  styleUrls: ['./other-brand-profile.component.scss']
})
export class OtherBrandProfileComponent implements OnInit {
  profileData: any = {};
  brandId: any;
  profileId: any;
  sub: any;
  isOtherBrand: boolean = true
  public brandProfileForm: FormGroup;
  interestList: any = [];
  category: any = '';
  isEditMode: boolean = false;
  brandProfileFormSubmitted: boolean = false;
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute, private toMediaUrl: ToMediaUrlPipe,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {

    this.stateChangeService.brandObservable$.subscribe(data => {console.log("------------",data)
      this.profileId = data['brandId'];
      this.getProfiledata()
    })

    
  }
  ngOnInit() {
    this.createSaveProfileForm();
  }
  profile_pic: any = ""
  cover_pic: any = ""
  saveProfile(saveOnlyImages) {
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
          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
    }
  }
  selected: string = ''

  onActivate(event) {
    let url = this.router.url;
    this.selected = url.substring(url.indexOf("brands/"), url.lastIndexOf("/"))
  }

  totalCount: any = 0
  profile_pic_path: any = ''

  cover_pic_path: any = ''

  getProfiledata() {
    //console.log("**********************", this.profileId)
    let apiUrl = 'Brand/getBrandProfile?brand_id=' + this.profileId + '&skip=0&limit=10';
    this.apiService.getRequest(apiUrl).then(
      (res) => {
        let bodyData = res;
        if (bodyData.statusCode == 200) {
          this.profileData = bodyData.data.my_profileData;
          this.category = bodyData.data.my_profileData.interests ? bodyData.data.my_profileData.interests[0].interest_name : '';

          this.brandProfileForm.patchValue({ brand_url: bodyData.data.my_profileData.url ? bodyData.data.my_profileData.url : '' });
          this.brandProfileForm.patchValue({ phone_number: bodyData.data.my_profileData.phone_number ? bodyData.data.my_profileData.phone_number : '' });
          this.brandProfileForm.patchValue({ brand_description: bodyData.data.my_profileData.about_me ? bodyData.data.my_profileData.about_me : '' });
          this.brandProfileForm.patchValue({ address: bodyData.data.my_profileData.address ? bodyData.data.my_profileData.address : '' });
          this.brandProfileForm.patchValue({ country: bodyData.data.my_profileData.country ? bodyData.data.my_profileData.country : '' });
          this.profile_pic_path = this.toMediaUrl.transform(bodyData.data.my_profileData.profile_pic)
          this.cover_pic_path = this.toMediaUrl.transform(bodyData.data.my_profileData.cover_pic)
          this.profile_pic = bodyData.data.my_profileData.profile_pic
          this.cover_pic = bodyData.data.my_profileData.cover_pic

        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
  createSaveProfileForm() {
    this.brandProfileForm = this.fb.group({
      brand_url: ['', [Validators.pattern(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/), Validators.required]], // 
      phone_number: ['', [Validators.required, Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im)]],
      brand_description: ['', [Validators.required]],
      // category: ['', [Validators.required]],
      address: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }

}
