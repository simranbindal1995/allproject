import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiCallsService } from './../../api-calls.service';
import { LoaderService } from './../../loader/loader-service'
import { ModalComponent } from './../../modal/modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit {

  constructor(private apiService: ApiCallsService, private loader: LoaderService, private router: Router) { }

  ngOnInit() {
    this.getAddedCards();
  }

  addedCards: any = [];


  @ViewChild('modalComponentCardList')
  modalComponent: ModalComponent;

  selectedCard = { cardId: '', card: <any>{} };

  getAddedCards() {
    this.loader.show();
    this.apiService.getRequest('brandStripe/listCardsOfCustomer').then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          this.addedCards = res.message.data;
          // if (this.addedCards.length) {
          //   this.selectedCard = { cardId: this.addedCards[0].id }
          // }
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }


  payNow() {
    if (this.selectedCard['card'].id) {
      let that = this;
      this.loader.show();
      this.apiService.postRequest('brandStripe/createCharge', {
        currency: 'GBP',
        stripeCustomerId: that.selectedCard['card'].customer,
        cardId: that.selectedCard['card'].id
      }).then(
        (res) => {
          this.loader.hide();
          if (res.statusCode == 200) {
            this.modalComponent.action({
              modalType: 'success',
              message: res.message,
              callback: function () {
                that.router.navigate(['/settings/payment-details'])
              }
            })
          } else {
          }
        }, (err) => {
          //console.log("err", err)
        }
      );
    } else {
      this.modalComponent.action({
        modalType: 'warning',
        message: "Please select a card to pay from.",
      })
    }
  }

  indexToDelete: any = ''

  cardIdToDelete: any = ''
  confirmCardDeletion(card, index) {
    this.cardIdToDelete = card.id;
    this.indexToDelete = index;
    this.modalComponent.action({
      modalType: 'confirmation',
      message: "Are you sure you want to delete the card with number **** **** **** " + card.last4 + " ?",

    })
  }

  deleteAddedCard(event) {
    this.loader.show();
    let that = this;
    this.apiService.putRequest('brandStripe/deleteCard', { cardId: this.cardIdToDelete }).then(
      (res) => {
        this.loader.hide();
        if (res.statusCode == 200) {
          this.modalComponent.action({
            modalType: 'success',
            message: res.message,
            callback: function () {
              that.cardIdToDelete = ''
              that.getAddedCards()
              // that.addedCards.splice(that.indexToDelete, 1)
              // that.indexToDelete = ''
            }
          })
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }
    );
  }
}
