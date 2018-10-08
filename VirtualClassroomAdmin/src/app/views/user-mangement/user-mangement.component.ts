import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ApproveUser } from '../../models/approve-user';

import { Usermangment } from '../../models/usermangment';

import { CommonService } from '../../services/common.service';

import swal from 'sweetalert2'
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-mangement',
  templateUrl: './user-mangement.component.html',
  styleUrls: ['./user-mangement.component.css']
})


export class UserMangementComponent implements OnInit {

  public approveModel: ApproveUser;
  public UserModel: Usermangment;
  public records: any[];
  public typeValue: string;
  public busy: Subscription;
  public api: string = environment.apiUrl;
  public assetUrl: string = environment.assetUrl;
  public search: string = '';

  public total: number;
  public page: number = 1;



  public skip: number = 0;
  public limit: number = 10;

  constructor(
    private commonService: CommonService,
    private location: Location
  ) {

    this.approveModel = new ApproveUser();
    this.UserModel = new Usermangment();
  }

  // onSelect(data: TabDirective, type: string): void {
  //   this.typeValue = type;
  //   this.getAlluser(1);
  // }

  //search
  onSearch(event: any) {
    this.search = event.target.value
    this.getAlluser({ page: this.page, itemsPerPage: this.limit });
  }

  // get all user
  getAlluser(pagination) {
    this.page = pagination.page;

    this.skip = this.page == 1 ? 0 : (this.page * this.limit) - this.limit;
    let request = { search: this.search, userType: this.UserModel.guru, skip: this.skip, limit: this.limit }
    this.busy =
      this.commonService.getService(this.api + 'admin/fetchAllUsers', request, true)
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

  //user-verify
  userVerify(event: any, id) {
    this.approveModel.user_id = id;
    this.approveModel.type = "approve";
    console.log(this.approveModel);
    this.busy =
      this.commonService.putService(this.api + 'admin/approveRejectGuru'
        , this.approveModel)
        .subscribe(data => {
          if (data.statusCode == 200) {

            swal({
              position: 'top-end',
              type: 'success',
              title: data.message,
              showConfirmButton: false,
              timer: 1500
            }).then((result) => {

              location.reload()
            })
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

  //usrBlock / unBlock
  changeStatus(id: string, type: string) {

    swal({
      title: 'Are you sure?',
      text: type == 'inactive' ? 'You want to de-activate this User ?' : 'You want to activate this User ?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: type == "inactive" ? 'Yes, Deactivate it!' : 'Yes, Activate it!'
    }).then((result) => {
      if (result.value) {
        let request = { userId: id, type: type }
        this.busy = this.commonService.putService(this.api + 'admin/activeInactiveUser' + '?userId=' + request.userId + '&type=' + request.type, false)
          .subscribe(data => {
            if (data.statusCode === 200) {
              swal({
                position: 'top-end',
                type: 'success',
                title: data.message,
                showConfirmButton: false,
                timer: 1500
              }).then(() => {
                location.reload();
              })

            } else {
              swal(data.message)
            }
          }, err => {
            swal(err.error.message)
          });

      }
    })

  }



  ngOnInit() {
    this.getAlluser({ page: this.page, itemsPerPage: this.limit });
  }



}
