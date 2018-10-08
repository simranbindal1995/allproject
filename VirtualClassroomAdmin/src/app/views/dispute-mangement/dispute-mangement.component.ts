import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

import { CommonService } from '../../services/common.service';

import swal from 'sweetalert2'
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dispute-mangement',
  templateUrl: './dispute-mangement.component.html',
  styleUrls: ['./dispute-mangement.component.css']
})
export class DisputeMangementComponent implements OnInit {

  public records: any[];
  public typeValue: string;
  public busy: Subscription;
  public api: string = environment.apiUrl;
  public assetUrl: string = environment.assetUrl;

  public total: number;
  public page: number = 1;

  public sessionId: any;
  public group: any;

  public skip: number = 0;
  public limit: number = 10;
  constructor(
    private commonService: CommonService,
    private location: Location
  ) { }


  // get all dispute List
  getDisputeList(pagination) {
    this.page = pagination.page;
    console.log(pagination);

    this.skip = this.page == 1 ? 0 : (this.page * this.limit) - this.limit;
    let request = { skip: this.skip, limit: this.limit }

    this.busy =
      this.commonService.getService(this.api + 'admin/disputeManagement', request, true)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.records = data.data;

            this.total = data.totalRecords;
          }
          else {
            swal(data.message)
          }
        }, err => {
          swal({
            text: err.message,
            type: 'error'
          });
        })
  }


  //refund

  changeStatus(id: any, type: any, status, rokkieID, message) {

    let d = new Date();
    let request = {
      sessionId: id.toString(),
      sessionType: type,
      actionToPerform: status,
      currentTime: d.getTime(),
      complaintMessage: message,
      rookieId: rokkieID
    }

    console.log(request);


    this.commonService.postService(this.api + 'Sessions/adminRespondToComplaint'
      , request)
      .subscribe(data => {
        console.log(data);
        if (data.statusCode == 200) {
          swal({
            type: 'success',
            title: 'Success',
            text: data.message,
          }).then((result) => {
            // if (result.value) {
            //   this.router.navigate(['/']);
            // }
          })
        }
        else {
        //  console.log(data.message);
          swal(data.message)
        }
      }, err => {
        swal({
          text: err.message,
          type: 'error'
        });
      })

  }


  ngOnInit() {
    this.getDisputeList({ page: this.page, itemsPerPage: this.limit });
  }

}
