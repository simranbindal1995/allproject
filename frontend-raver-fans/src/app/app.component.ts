import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { StateChangeService } from './stateChange.service';
import { AuthCheckService } from './auth-check.service';
import { ModalComponent } from './modal/modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  public router: any;

  
  @ViewChild('modalComponentApp')
  modalComponent: ModalComponent;

  constructor(public _router: Router, private stateChangeService: StateChangeService, private auth: AuthCheckService) { }
  ngOnInit() {
    this.stateChangeService.alertObservable$.subscribe((data) => {
      this.modalComponent.action(data);
    })

    
    this.stateChangeService.stateChanged({ currentStateURL: this._router.url, isLoggedInUser: this.auth.isLoggedIn() });
  }

  hidePostLoginFooter = false

  onActivate(event) {
    window.scrollTo(0, 0);
    if(localStorage.getItem('access_token') && JSON.parse(localStorage.getItem('access_token')).value){
      this.hidePostLoginFooter=true
    }else{
      this.hidePostLoginFooter=false
    }

    this.stateChangeService.stateChanged({ currentStateURL: this._router.url, isLoggedInUser: this.auth.isLoggedIn() });
  }
}
