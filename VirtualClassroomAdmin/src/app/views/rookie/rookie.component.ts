import { Component, OnInit } from '@angular/core';
import { Usermangment } from '../../models/usermangment';

import { CommonService } from '../../services/common.service';

import swal from 'sweetalert2'
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-rookie',
  templateUrl: './rookie.component.html',
  styleUrls: ['./rookie.component.css']
})
export class RookieComponent implements OnInit {

  public UserModel: Usermangment;
  public records: any[];
  public typeValue: string = "2";
  public busy: Subscription;
  public api: string = environment.apiUrl;
  public assetUrl: string = environment.assetUrl;
  public search: string = '';

  public total: number;
  public page: number = 1;



  public skip: number = 0;
  public limit: number = 10;

  constructor(
    private commonService: CommonService
  ) {
    this.UserModel = new Usermangment();
  }

  //search
  onSearch(event: any) {
    this.search = event.target.value
    this.getAlluser({ page: this.page, itemsPerPage: this.limit });
  }

  // get all user
  getAlluser(pagination) {
    this.page = pagination.page;
    // console.log(this.page);
    // console.log(pagination);
    this.skip = this.page == 1 ? 0 : (this.page * this.limit) - this.limit;
    let request = { search: this.search, userType: this.UserModel.rokkie, skip: this.skip, limit: this.limit }
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

  ngOnInit() {
    this.getAlluser({ page: this.page, itemsPerPage: this.limit });
  }

}
