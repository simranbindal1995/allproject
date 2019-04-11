import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiCallsService } from './../api-calls.service';
import { SnotifyService } from 'ng-snotify';
import { AuthCheckService } from './../auth-check.service';
import { ThrowStmt } from '@angular/compiler';
// import { } from '@types/googlemaps';
import { Pipe, PipeTransform } from '@angular/core'
import { HttpClient } from '@angular/common/http';
import { LoaderService } from './../loader/loader-service'
import { ModalComponent } from '../modal/modal.component'
@Component({
  selector: 'app-rave-request',
  templateUrl: './rave-request.component.html',
  styleUrls: ['./rave-request.component.css']
})
export class RaveRequestComponent implements OnInit {
  sub: any
  tab: number
  message: any
  displayApproved: any
  displayToBeApproved: any
  declinePostId: any
  declineRaveForm: FormGroup
  declineRavemessage: any

  @ViewChild('modalComponentRequestRave')
  modalComponent: ModalComponent;
  constructor(private http: HttpClient, private ac: ActivatedRoute, private fb: FormBuilder, private router: Router, public api: ApiCallsService, private snotifyService: SnotifyService, public apiService: ApiCallsService, private loader: LoaderService) {}

  previouslySelectedTab: any = ''
  ngOnInit() {

    this.sub = this.ac.params.subscribe(params => {
      if (params["tab"] == 'approved-requests') {
        this.tab = 2
      } else {
        this.tab = 1
      }
      if (this.previouslySelectedTab != this.tab) {
        this.requestSkip = 0;
        this.requestLimit = 10;
        this.requests = [];
        this.getRequests()
      }

      this.previouslySelectedTab = this.tab;

    });
    this.declineRaveForm = this.fb.group({
      reason: ['', [Validators.required]]
    });
  }

  requests: any = []
  totalRequests: number = 0;
  requestSkip: any = 0;
  requestLimit: any = 10;

  tabChanged() {

  }

  getRequests() {
    if (this.tab == 2) {
      document.getElementById("Approved").style.display = 'block'
      document.getElementById("beApproved").style.display = 'none'
    } else {
      document.getElementById("Approved").style.display = 'none'
      document.getElementById("beApproved").style.display = 'block'
    }
    this.loader.show();
    this.apiService.getRequest('Brand/raveList?type=' + this.tab + '&skip=' + this.requestSkip + '&limit=' + this.requestLimit).then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.requests.push(...res.data);
          this.totalRequests = res.count;
          this.requestSkip += this.requestLimit
        } else {}
      }, (err) => {

        //console.log("err", err)
      }
    );
  }

  approveRave(rave_id) {
    this.loader.show()
    this.apiService.putRequest('Rave/approveRave', { rave_id: rave_id }).then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          this.tab = 1
          let that = this;

          this.modalComponent.action({
            modalType: bodyData.status,
            message: bodyData.message,
            callback: function() {
              that.requests.forEach((element, key) => {
                if (element._id == rave_id) {
                  that.requests.splice(key, 1);
                  element.status = 1;
                }
              });
            }
          })
        } else {
          this.modalComponent.action({
            modalType: bodyData.status,
            message: bodyData.message,
            callback: function() {}
          })
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  declineRaveConfirm() {
    this.modalComponent.action({
      modalType: 'confirmation',
      message: 'Are you sure you want to decline this post?',
    })
  }

  declineRave() {
    this.loader.show()
    if (this.declineRaveForm.controls.reason.value != '') {
      this.apiService.putRequest('Rave/declineRave', { rave_id: this.declinePostId, reason: this.declineRaveForm.controls.reason.value }).then(
        (res) => {
          this.loader.hide()
          let bodyData = res
          let that = this;
          if (bodyData.statusCode == 200) {
            this.tab = 1
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message,
              callback: function() { //only for success - warning - error 
                that.requests.forEach((element, key) => {
                  if (element._id == that.declinePostId) {
                    that.requests.splice(key, 1);
                    element.status = 2;
                  }
                });
                document.getElementById("hidedeclineModal").click();
              }
            })

          } else {
            this.modalComponent.action({
              modalType: bodyData.status, //success - warning - confirmation - error
              message: bodyData.message,
              callback: function() { //only for success - warning - error 
              }
            })
          }
        }, (err) => {

          //console.log("err", err)
        }
      );
    } else {
      this.declineRavemessage = 'Enter reason to decline the post.'
    }
  }

  setDeclinePostId(id) {
    this.declineRavemessage = ''
    this.declinePostId = id

  }
  clearData() {
    this.declineRaveForm.reset();
  }
}
