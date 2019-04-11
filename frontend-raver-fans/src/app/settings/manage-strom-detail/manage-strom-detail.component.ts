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
import { ModalComponent } from '../../modal/modal.component'
@Component({
  selector: 'app-manage-strom-detail',
  templateUrl: './manage-strom-detail.component.html',
  styleUrls: ['./manage-strom-detail.component.css']
})
export class ManageStromDetailComponent implements OnInit {
  public stromData
  public totalCount
  initMessage: any = {}
  public sub: any
  requestData: any
  public strom_id: string
  userInfo: any = {}
  reply: string = '';
  status: string
  @ViewChild('modalComponentStorm')
  modalComponent: ModalComponent;
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    // private modalService: ModalService,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {
  }
  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.strom_id = params['id'];
    });
    this.getStromData()
  }
  showReplyTab() {
    //console.log("in show reply tab")
    document.getElementById('replyTab').style.display = 'block'
  }

  getStromData() {
    this.loader.show()
    this.apiService.getRequest('Storm/detailStorm?storm_id=' + this.strom_id).then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.initMessage = bodyData.data;
          this.status = bodyData.data.status
          this.stromData = bodyData.data.reply;

          this.userInfo = this.auth.getUserInfo()
          // this.totalCount = bodyData.count;
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
  changeStatus(val) {

    this.requestData = {
      storm_id: this.strom_id,
      status: val
    }
    if (val != 0) {
      this.apiService.postRequest('Storm/changeStormStatus', this.requestData).then(
        (res) => {
          this.loader.hide()
          let bodyData = res.body
          if (bodyData.statusCode == 200) {
            this.reply = ''
            this.modalComponent.action({
              modalType: bodyData.status,
              message: bodyData.message, callback: function () {
                //console.log("callback function")
              }, timer: 2500
            })
          } else {
            // this.modalService.action({
            //   modalType: bodyData.status,
            //   message: bodyData.message, callback: function () {
            //     //console.log("callback function")
            //   }, timer: 2500
            // })
          }

        }, (err) => {
          //console.log("err", err)
        }
      );
    }
  }

  replyOnStrom() {
    this.loader.show()
    this.requestData = {
      storm_id: this.strom_id,
      descriptions: this.reply
    }
    this.apiService.postRequest('Storm/replyOnStorm', this.requestData).then(
      (res) => {
        let bodyData = res.body
        if (bodyData.statusCode == 200) {
          this.reply = ''
          this.getStromData()
          this.loader.hide()
          // this.modalService.action({
          //   modalType: bodyData.status,
          //   message: bodyData.message, callback: function () {
          //     //console.log("callback function")
          //   }, timer: 2500
          // })
        } else {
          this.loader.hide()

          // this.modalService.action({
          //   modalType: bodyData.status,
          //   message: bodyData.message, callback: function () {
          //     //console.log("callback function")
          //   }, timer: 2500
          // })
        }

      }, (err) => {
        //console.log("err", err)
      }
    );
  }
}
