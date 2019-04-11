import {
  OnInit,
  TemplateRef,
  AfterViewInit,
  OnDestroy,
  ViewChildren,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  ViewEncapsulation
} from '@angular/core';
import { AuthCheckService } from '../../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from '../../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from '../../stateChange.service';
import { ToMediaUrlPipe } from '../../pipes/to-media-url.pipe';
import { AppComponent } from '../../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from '../../loader/loader-service'
import { request } from 'http';
import { ModalComponent } from '../../modal/modal.component'
import { setTimeout } from 'timers';
import { ChangeDetectorRef } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-manage-rewards',
  templateUrl: './manage-rewards.component.html',
  styleUrls: ['./manage-rewards.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageRewardsComponent implements OnInit {
  @ViewChild(ModalDirective) setRewardModal: ModalDirective;
  @ViewChild('fileUpload') myInputVariable: ElementRef;
  manageRewards: any = {}
  totalCount: any = 0
  public records_per_page: number = 10;
  public skip: number = 0;
  public limit: number = 10;
  p: number = 1;
  page_number: number = 1;
  // public rewards = [];
  public rewards: any = [];
  requestData: any;
  rewardsForm: FormGroup
  editrewardsForm: FormGroup
  setRewardsData: FormGroup
  success_message: string
  addRewardsForm: FormGroup
  rewardsImage: any
  message: string
  AddformSubmitted: boolean
  public rewardsArray: any = []
  reward_id: string
  @ViewChild('modalComponentManageRewards')
  modalComponent: ModalComponent;

  constructor(
    private stateChangeService: StateChangeService,
    // private modalService: ModalService,
    private appComponent: AppComponent,
    private toMediaUrl: ToMediaUrlPipe,
    private cd: ChangeDetectorRef,
    public apiService: ApiCallsService,
    public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {
    this.getRewards();
  }

  ngOnInit() {
    this.rewardsFormValidate()
    this.setRewardsData = this.fb.group({
      editRewardPoints: ['', [Validators.required]],
      editTextRewards: ['', [Validators.required]],
    });
    this.addRewardsForm = this.fb.group({
      saveRewards: ['', [Validators.required, Validators.min(1), this.noWhitespaceValidator, Validators.pattern('^[0-9]{1,15}$')]],
      saveText: ['', [Validators.required, this.noWhitespaceValidator]],
    });
    this.getRewards();
  }

  ngAfterViewInit() {

  }

  getRewards() {
    console.log('here in manage reqardsa    ------------------- ', this.skip, this.limit)
    this.loader.show();
    this.apiService.getRequest('rewards/manageRewards?skip=' + this.skip + '&limit=' + this.limit).then(
      (res) => {

        this.loader.hide();
        let bodyData = res;

        if (bodyData.statusCode == 200) {
          this.rewardsForm.controls['textRewards'].setValue(bodyData.data.points.text.toString())
          this.rewardsForm.controls['imageRewards'].setValue(bodyData.data.points.image.toString())
          this.rewardsForm.controls['videoRewards'].setValue(bodyData.data.points.video.toString())

          this.rewards = bodyData.data.rewards_data;
          let rewardsVar = bodyData.data.rewards_data;
          this.totalCount = bodyData.count;
          rewardsVar.forEach((element, key) => {
            if (key > -1) {
              this.cd.markForCheck();
            }
          })

        } else { }
      }, (err) => {
        // console.log("err", err)
      }
    );
  }

  saveRewards() {
    if (this.rewardsForm.valid) {
      this.loader.show()
      this.requestData = {
        text_point: this.rewardsForm.controls.textRewards.value,
        image_point: this.rewardsForm.controls.imageRewards.value,
        video_point: this.rewardsForm.controls.videoRewards.value
      }
      this.apiService.postRequest('rewards/editRewardPoints', this.requestData).then(
        (res) => {
          this.loader.hide();
          let bodyData = res.body;
          if (bodyData.statusCode == 200) {
            this.modalComponent.action({
              modalType: bodyData.status, // success - warning - confirmation - error
              message: bodyData.message,
              callback: function () { // only for success - warning - error 
              },
              timer: 2500
            });
          } else {
            this.modalComponent.action({
              modalType: bodyData.status, // success - warning - confirmation - error
              message: bodyData.message,
              callback: function () { // only for success - warning - error 
                // this.forgotErrorMessage = ''
              },
              timer: 2500
            });
          }
        }, (err) => {
          // console.log("err", err)
        }
      );
    }
  }
  rewardsFormValidate() {
    this.rewardsForm = this.fb.group({
      textRewards: ['', [Validators.required, Validators.min(1)]],
      imageRewards: ['', [Validators.required, Validators.min(6)]],
      videoRewards: ['', [Validators.required, Validators.min(11)]]
    });
  }

  getFieldValues(data) {
    this.reward_id = data._id;
    this.setRewardsData.controls.editRewardPoints.setValue(data.points);
    this.setRewardsData.controls.editTextRewards.setValue(data.text);
    this.rewardsImage = this.toMediaUrl.transform(data.reward_pic);
    this.rewardsImageFileId = data.reward_pic;
  }
  deleteRewardConfirm(data) {
    this.modalComponent.action({
      params: {
        reward_id: data._id,
      },
      modalType: 'confirmation',
      message: 'Are you sure you want to delete this reward?',
    });
  }

  deleteReward(params) {
    this.loader.show();
    this.requestData = {
      reward_id: params.reward_id
    };
    this.apiService.putRequest('rewards/deleteRewards', this.requestData).then(
      (res) => {
        this.loader.hide();
        this.modalComponent.close();
        let bodyData = res;
        if (bodyData.statusCode == 200) {
          let rewardArray = this.rewards;
          rewardArray.forEach((element, key) => {
            if (element._id == params.reward_id) {
              rewardArray.splice(key, 1);
              this.rewards = rewardArray;
            }
          });
          // for refreshing the records for pagination
          this.totalCount = this.totalCount - 1;
          if (this.totalCount > 0) {
            if (this.rewards.length == 0) {
              this.pageChanged(this.page_number - 1);
            } else if (this.rewards.length > 0) {
              this.pageChanged(this.page_number);
            }
          }
          this.rewardsImageFileId = '';
        } else { }
      }, (err) => {
        // console.log("err", err)
      }
    );
  }

  pageChanged(page) {
    if (page < this.page_number) {
      if (this.skip != 0) {
        this.skip = this.skip - this.limit;
        this.getRewards();
      }
      this.page_number = page;
    } else if (page > this.page_number) {
      if (this.records_per_page == 10 && this.totalCount > 10) {
        this.skip += this.limit;
        this.getRewards();
      }
      this.page_number = page;
    } else {

      this.getRewards();
    }
  }


  addRewards() {
    this.loader.show();
    this.requestData = {
      points: this.addRewardsForm.controls.saveRewards.value,
      image: this.rewardsImageFileId,
      text: this.addRewardsForm.controls.saveText.value
    };
    console.log('this.requestData', this.requestData);
    // return 0;
    this.apiService.postRequest('rewards/setRewards', this.requestData).then(
      (res) => {
        this.loader.hide();
        let bodyData = res.body;
        if (bodyData.statusCode == 200) {
          this.message = '';
          this.success_message = bodyData.message;
          this.getRewards();
          this.setRewardModal.hide();
          setTimeout(() => {
            this.modalComponent.action({
              modalType: bodyData.status, // success - warning - confirmation - error
              message: bodyData.message,
              callback: function () { // only for success - warning - error
                document.getElementById('closeAddPopUp').click();
              },
              timer: 2500
            })
          }, 500);
          this.AddformSubmitted = false;
        } else {
          this.modalComponent.action({
            modalType: bodyData.status, // success - warning - confirmation - error
            message: bodyData.message,
            callback: function () { // only for success - warning - error 
            },
            timer: 2500
          })
        }
      }, (err) => {
        // console.log("err", err)
      }
    );
  }
  setRewardEmpty() {
    this.addRewardsForm.reset();
    this.myInputVariable.nativeElement.value = '';
  }

  fileToUpload: any;
  postImage: string = '';
  postVideo: string = '';
  rewardsImageFileId: string = '';
  handleFileInput(files: FileList) {
    if (files.item(0)) {
      this.fileToUpload = files.item(0);
      if ((this.fileToUpload.type.indexOf('image') > -1) || (this.fileToUpload.type.indexOf('video') > -1)) {

        this.loader.show();
        this.apiService.uploadMedia(
          'Files/uploadTmp',
          this.fileToUpload,
          (this.fileToUpload.type.indexOf('video') > -1) ? 'true' : 'false', false).then(
            (res) => {

              let bodyData: any;
              bodyData = res;

              if (bodyData.statusCode == 200) {
                if (this.fileToUpload.type.indexOf('image') > -1) {
                  this.postVideo = '';
                  let reader = new FileReader();
                  if (this.fileToUpload) {
                    reader.readAsDataURL(this.fileToUpload);
                    this.rewardsImage = '';
                    reader.onload = () => {
                      this.loader.hide();
                      this.rewardsImage = reader.result;
                      document.getElementById('rewardsDiv').click();

                    };
                  }
                  this.rewardsImageFileId = bodyData.data.fileId;
                }

              } else { }
            }, (err) => {
              // console.log("err", err)
            }
          );
      }
    }
  }
  saveEditRewards() {
    this.loader.show();
    this.requestData = {
      reward_id: this.reward_id,
      points: this.setRewardsData.controls.editRewardPoints.value,
      image: this.rewardsImageFileId,
      text: this.setRewardsData.controls.editTextRewards.value
    }

    this.apiService.postRequest('rewards/editRewards', this.requestData).then(
      (res) => {
        this.loader.hide();
        let bodyData = res.body;
        if (bodyData.statusCode == 200) {
          this.rewards.forEach(element => {
            if (element._id == this.reward_id) {
              element = bodyData.data;
            }
          });
          this.getRewards();
          this.modalComponent.action({
            modalType: bodyData.status, // success - warning - confirmation - error
            message: bodyData.message,
            callback: function () { // only for success - warning - error
              document.getElementById('closeEditPopUp').click();
            },
            timer: 2500
          });
        } else {
          this.modalComponent.action({
            modalType: bodyData.status, // success - warning - confirmation - error
            message: bodyData.message,
            callback: function () { // only for success - warning - error
            },
            timer: 2500
          });
        }
      }, (err) => {
        // console.log("err", err)
      }
    );

  }



  chooseMedia() {
    event.stopPropagation();
    document.getElementById('fileUpload').click();
  }
  // tslint:disable-next-line:max-line-length
  public noWhitespaceValidator(control: FormControl) {
    let isWhitespace = (control.value || '').trim().length === 0;
    let isValid = !isWhitespace; return isValid ? null : { 'whitespace': true };
  }

}
