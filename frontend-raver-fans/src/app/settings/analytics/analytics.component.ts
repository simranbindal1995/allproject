import { Component, OnInit } from '@angular/core';
import { AuthCheckService } from '../../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from '../../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from '../../stateChange.service';
import { AppComponent } from '../../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from '../../loader/loader-service'
@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  analyticsData
  raveDate;
  totalRaves;
  stormDate;
  totalStorm;
  fanDate;
  totalFans;
  unfollowDate;
  totalUnfollow;
  filter;
  filterType;
  dateNow: Date = new Date();
  // lineChart
  lineChartData: Array<any> =
    [
      { data: [], label: 'Raves' },
      { data: [], label: 'Storms' },
      { data: [], label: 'Fans followed' },
      { data: [], label: 'Fans unfollowed' }
    ];
  lineChartLabels: any = []
  lineChartOptions: any = {
    responsive: true,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          userCallback: function (label, index, labels) {
            if (Math.floor(label) === label) {
              return label;
            }
          }
        }
      }]
    }
  }
  lineChartColors: Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: '#0472E2',
      pointBackgroundColor: '#0472E2',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // dark grey
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: '#002B59',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    { // grey
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: '#9B68AF',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  lineChartLegend: boolean = true;
  lineChartType: string = 'line';



  ngOnInit() {
    
    if (this.router.url == '/settings/analytics/PAST_HOUR') {
      this.filterType = 1
    } else if (this.router.url == '/settings/analytics/PAST_WEEK') {
      this.filterType = 2
    } else if (this.router.url == '/settings/analytics/PAST_DAY') {
      this.filterType = 3
    } else if (this.router.url == '/settings/analytics/PAST_MONTH') {
      this.filterType = 4
    }
    this.getChartsData()
  }
  ngAfterViewInit() {
  }
  getChartsData() {
    this.loader.show()
    let dateNowISO = this.dateNow.toISOString();
    this.apiService.getRequest('Brand/Analytics?date_filters=' + this.filterType + '&current_date=' + dateNowISO).then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {


          this.analyticsData = bodyData.data;
          this.raveDate = bodyData.data.rave.date;
          this.totalRaves = bodyData.data.rave.totalRaves;

          this.stormDate = bodyData.data.storm.date;
          this.totalStorm = bodyData.data.storm.totalStorm;

          this.fanDate = bodyData.data.fan.date;
          this.totalFans = bodyData.data.fan.totalFans;

          this.unfollowDate = bodyData.data.unfollow.date;
          this.totalUnfollow = bodyData.data.unfollow.totalUnfollow;

          this.lineChartData = [
            { data: this.totalRaves, label: 'Raves' },
            { data: this.totalStorm, label: 'Storms' },
            { data: this.totalFans, label: 'Fans followed' },
            { data: this.totalUnfollow, label: 'Fans unfollowed' }
          ];
          this.lineChartLabels = bodyData.data.rave.date



          this.charts = []
          this.charts.push({ labels: this.lineChartLabels, data: this.lineChartData })
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  charts: any = []
  // // events
  // public chartClicked(e: any): void {
  //   //console.log(e);
  // }

  // public chartHovered(e: any): void {
  //   //console.log(e);
  // }

  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    private apiService: ApiCallsService, 
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService) {


  }


}
