import { Component, OnInit } from '@angular/core';

import { ApiCallsService } from './../../api-calls.service';
import { LoaderService } from './../../loader/loader-service'

@Component({
  selector: 'app-previous-payments',
  templateUrl: './previous-payments.component.html',
  styleUrls: ['./previous-payments.component.scss']
})
export class PreviousPaymentsComponent implements OnInit {

  constructor(private apiService: ApiCallsService, private loader: LoaderService, ) { }

  ngOnInit() {
    this.getTransactions()
  }

  skip: any = 0;
  limit: any = 1000;
  currentPage: number = 1
  transactions: any = [];
  totalTransactions: any = 0;
  getTransactions() {
    this.loader.show();
// //console.log(this.currentPage)
//     this.skip = (this.limit * this.currentPage) - this.limit;

    this.apiService.getRequest('Brand/pastBilling?skip=' + this.skip + '&limit=' + this.limit).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          this.transactions = res.data;
          this.totalTransactions = res.count
        } else {
        }
      }, (err) => {
        this.loader.hide();
        //console.log("err", err)
      }
    );
  }

}
