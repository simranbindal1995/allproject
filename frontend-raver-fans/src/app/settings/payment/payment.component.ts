import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiCallsService } from './../../api-calls.service';
import { LoaderService } from './../../loader/loader-service'
import { ModalComponent } from './../../modal/modal.component';
import { Router } from '@angular/router';


@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {

  constructor(private apiService: ApiCallsService, private loader: LoaderService, private router: Router, ) { }

  ngOnInit() {
    this.getPaymentScreenData();
    // this.getTransactions();
  }

  @ViewChild('modalComponentPayment')
  modalComponent: ModalComponent;


  setNewFollowerLimit(limit) {
    let that = this;
    this.loader.show();
    this.apiService.putRequest('Brand/editFollowerslimit', {
      "followers_limit": limit
    }).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          that.modalComponent.action({
            modalType: 'success',
            message: res.message,
          })
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }

  followerLimitList = [
    { id: 2, limit: 100, commission: '10%' },
    { id: 3, limit: 1000, commission: '9%' },
    { id: 4, limit: 10000, commission: '8%' },
    { id: 5, limit: 50000, commission: '7%' },
    { id: 6, limit: 100000, commission: '6%' },
    { id: 7, limit: 1000000, commission: '5%' }
  ]

  followersLimit: any = '1'
  paymentDetails: any = {}

  getPaymentScreenData() {

    this.loader.show();
    this.apiService.getRequest('Brand/paymentAmount').then(
      (res) => {
        if (res.statusCode == 200) {
          this.paymentDetails.result = [];
          this.paymentDetails = res.data
          this.subscriptionAlterationStatus = this.paymentDetails.subscription_status + "";
          this.apiService.getRequest('Brand/followersLimit').then(
            (res) => {
              this.loader.hide();
              if (res.statusCode == 200) {
                this.followersLimit = res.data;
                // this.getTransactions();
              } else {
              }
            }, (err) => {
              this.loader.hide();

              //console.log("err", err)
            }
          );

        } else {
        }
      }, (err) => {
        this.loader.hide();
        //console.log("err", err)
      }
    );
  }



  // skip: any = 0;
  // limit: any = 5;
  // transactions: any = [];
  // totalTransactions: any = 0;
  // getTransactions() {
  //   this.loader.show();
  //   this.apiService.getRequest('Brand/transations?skip=' + this.skip + '&limit=' + this.limit).then(
  //     (res) => {
  //       this.loader.hide();
  //       if (res.statusCode == 200) {
  //         this.transactions.push(...res.data);
  //         this.totalTransactions = res.count
  //         this.skip += this.limit;
  //       } else {
  //       }
  //     }, (err) => {
  //       this.loader.hide();
  //       //console.log("err", err)
  //     }
  //   );
  // }

  subscriptionAlterationStatus: any = '1' // 1 = "End" // 2 = "Resume"  // text for the button


  confirmSubscriptionAlteration(status) { //status = 1 (end) / status =2 (resume)
    this.subscriptionAlterationStatus = status;
    this.modalComponent.action({
      modalType: 'confirmation',
      confirmButtonText: this.paymentDetails.total_dues ? 'Proceed' : null,
      message: status == '1' ? "Are you sure you want to end your subscription ? *Note: You can resume it anytime by paying all you dues as a lump sum." : (status == '2' && this.paymentDetails.total_dues ? 'To Resume subscription, you need to clear all your dues. Current Dues = GBP ' + this.paymentDetails.total_dues + '. Please proceed to pay.' : 'Are you sure you want to resume your subscription ?')
    })
  }

  alterSubscriptionStatus() {
    let apiUrl = ''

    if (this.subscriptionAlterationStatus == '1') { // end subscription
      apiUrl = "Brand/endSubscription";
    } else if (this.subscriptionAlterationStatus == '2') { // resume subscription
      if (this.paymentDetails.total_dues) {
        this.router.navigate(['/settings/cards']);
        return false;
      } else {
        apiUrl = "Brand/resumeSubscription";
      }
    }
    this.loader.show();
    this.apiService.putRequest(apiUrl, {}).then(res => {
      this.loader.hide();
      if (res.statusCode == 200) {
        this.subscriptionAlterationStatus == '1' ? this.subscriptionAlterationStatus = "2" : this.subscriptionAlterationStatus = "1"

        this.modalComponent.action({
          modalType: 'success',
          message: res.message
        })
        document.getElementById("modalComponentPaymentClose").click();
      } else {
      }
    }, (err) => {
      this.loader.hide();
      //console.log("err", err)
    });
  }

}
