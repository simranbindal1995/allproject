import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-payment-group',
  templateUrl: './payment-group.component.html',
  styleUrls: ['./payment-group.component.css']
})
export class PaymentGroupComponent implements OnInit {

  public records: any[];
  public busy: Subscription;
  public api: string = environment.apiUrl;

  public total: number;
  public page: number = 1;

  public isVisible: boolean = false;



  public skip: number = 0;
  public limit: number = 10;

  public chardata: any = {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: '',
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ]
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,

          }
        }]
      }
    }
  }

  constructor(
    private commonService: CommonService
  ) { }

  // get all user
  getAllrecords(pagination) {
    this.page = pagination.page;
    this.skip = this.page == 1 ? 0 : (this.page * this.limit) - this.limit;
    let request =
      { typeOfLesson: 'group', typeOfTransaction: 1, skip: this.skip, limit: this.limit }
    this.busy =
      this.commonService.getService(this.api + 'admin/paymentManagement', request, true)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.records = data.data;
            //console.log(data.totalRecords);
            this.chardata.data.labels = data.graphData.labels;
            this.chardata.data.datasets[0].label = data.graphData.datasets[0].label;
            this.chardata.data.datasets[0].data = data.graphData.datasets[0].data;
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


  //graph-view
  graphView(event) {

    this.isVisible = !this.isVisible;

  }

  //routeclick
  onRoute() {
    this.isVisible = !this.isVisible;
  }


  ngOnInit() {
    this.getAllrecords({ page: this.page, itemsPerPage: this.limit });

  }
}
