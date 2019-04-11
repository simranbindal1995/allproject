import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService } from './../../payment.service';
import { LoaderService } from './../../loader/loader-service';
import { ApiCallsService } from './../../api-calls.service';
import { ModalComponent } from './../../modal/modal.component';
import { Router } from '@angular/router';



@Component({
  selector: 'app-add-card',
  templateUrl: './add-card.component.html',
  styleUrls: ['./add-card.component.scss']
})
export class AddCardComponent implements OnInit {
  public cardDetails: FormGroup;
  public isCardValid: boolean = true;
  public isExpiryDateValid: boolean = true;
  public isCvcValid: boolean = true;
  public months = [];
  public years = [];
  public d = new Date();
  public currentYear = this.d.getFullYear();


  @ViewChild('modalComponentCards')
  modalComponent: ModalComponent;


  constructor(private paymentService: PaymentService, private router: Router, private apiService: ApiCallsService, private fb: FormBuilder, private loader: LoaderService) {


    this.months = [
      // { id: '', name: "Month", disabled: true },
      { id: 1, name: "Jan" },
      { id: 2, name: "Feb" },
      { id: 3, name: "Mar" },
      { id: 4, name: "Apr" },
      { id: 5, name: "May" },
      { id: 6, name: "Jun" },
      { id: 7, name: "Jul" },
      { id: 8, name: "Aug" },
      { id: 9, name: "Sept" },
      { id: 10, name: "Oct" },
      { id: 11, name: "Nov" },
      { id: 12, name: "Dec" }
    ]
    // this.years.push({ id: '', name: 'Year', disabled: true });
    for (let i = 0; i < 20; i++) {
      this.years.push({ name: this.currentYear + i, id: this.currentYear + i })
    }

  }

  createForm() {
    this.cardDetails = this.fb.group({
      card_number: ['', [Validators.required, Validators.maxLength(19)]],
      name_on_card: ['', [Validators.required, Validators.maxLength(21), Validators.pattern("^[a-zA-Z0-9\\-\\s]+$")]],
      expiry_month: ['', Validators.required],
      expiry_year: ['', Validators.required],
      cvc: ['', [Validators.required, Validators.maxLength(5)]]
    })
  }


  validateCardNumber(event) {
    let cardNumber = event.target.value;

    if (cardNumber.length <= 0) {
      this.isCardValid = true;
      return false;
    }
    if (cardNumber.length > 19) {
      cardNumber = cardNumber.slice(0, 19);
      this.cardDetails.patchValue({ card_number: cardNumber });
      this.isCardValid = this.paymentService.validateCardNumber(event.target.value);
    } else {
      this.isCardValid = this.paymentService.validateCardNumber(event.target.value);
    }

  }
  validateCardExpiry(event, type) {
    this.isExpiryDateValid = this.paymentService.validateCardExpiry(this.cardDetails.controls['expiry_month'].value, this.cardDetails.controls['expiry_year'].value);
  }
  validateCVC(event) {
    let cvc = event.target.value;
    if (cvc.length <= 0) {
      this.isCardValid = true;
      return false;
    }
    if (cvc.length > 5) {
      cvc = cvc.slice(0, 5);
      this.cardDetails.patchValue({ cvc: cvc });
      this.isCvcValid = this.paymentService.validateCVC(cvc);
    } else {
      this.isCvcValid = this.paymentService.validateCVC(cvc);
    }
  }

  submitForm() {
    this.loader.show();
    let cardPayload = {
      number: this.cardDetails.controls['card_number'].value,
      name: this.cardDetails.controls['name_on_card'].value,
      cvc: this.cardDetails.controls['cvc'].value,
      exp_month: this.cardDetails.controls['expiry_month'].value,
      exp_year: this.cardDetails.controls['expiry_year'].value

    }

    //console.log(cardPayload)

    this.paymentService.createCardToken(cardPayload, (status, response) => {
      let that = this;
      this.loader.hide();
      if (response.error) {

      } else {
        //console.log("card token id", response.id);
        this.apiService.putRequest('brandStripe/addCard', { cardTokenToUse: response.id }).then(
          (res) => {
            this.loader.hide();
            if (res.statusCode == 200) {
              that.modalComponent.action({
                modalType: 'success',
                message: res.message,
                callback: function () {
                  that.router.navigate(['/settings/cards'])
                }
              })
            } else {
            }
          }, (err) => {
            //console.log("err", err)
          }
        );
      }
    })




  }

  ngOnInit() {
    this.createForm();
  }

}
