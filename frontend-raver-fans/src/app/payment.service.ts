import { Injectable } from '@angular/core';

@Injectable()
export class PaymentService {

  constructor() {
    Stripe.setPublishableKey('pk_test_aGbxmguCZzEPfX6Tq0EKAD5w');
  }
  validateCardNumber(card_number): boolean {
    return Stripe.card.validateCardNumber(card_number);
  }
  validateCVC(cvc): boolean {
    return Stripe.card.validateCVC(cvc);
  }
  validateCardExpiry(month, year) {
    return Stripe.card.validateExpiry(month, year)
  }
  createCardToken(card, callback) {
    Stripe.card.createToken({
      number: card.number,
      cvc: card.cvc,
      name: card.name,
      exp_month: card.exp_month,
      exp_year: card.exp_year
    }, (status, response) => {
      callback(status, response);
    })
  }


}