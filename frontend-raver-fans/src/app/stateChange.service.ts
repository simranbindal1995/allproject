
import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs/Subject';
@Injectable()
export class StateChangeService {
  private state = new Subject<any>();
  stateObservable$ = this.state.asObservable();

  private profile = new Subject<any>();
  profileObservable$ = this.profile.asObservable();
  private follower = new Subject<any>();
  followerObservable$ = this.follower.asObservable();
  private brand = new Subject<any>();
  brandObservable$ = this.brand.asObservable();


  private broadcastData = new Subject<any>();
  broadcastDataObservable$ = this.broadcastData.asObservable();

  private unreadMessages = new Subject<any>();
  unreadMessagesObservable$ = this.unreadMessages.asObservable();

  private alert = new Subject<any>();
  alertObservable$ = this.alert.asObservable();

  constructor() { }

  public stateChanged(data: any) {
    if (data) {
      this.state.next(data);
    }
  }
  public profileUpdated(data: any) {
    if (data) {
      this.profile.next(data);
    }
  }
  public followerIdUpdated(data: any) {
    if (data) {
      this.follower.next(data);
    }
  }
  public brandIdUpdated(data: any) {
    if (data) {
      this.brand.next(data);
    }
  }


  public broadcastDataFunction(data: any) {
    if (data) {
      this.broadcastData.next(data);
    }
  }
  public getUnreadMessages(data: any) {
    if (data) {
      this.unreadMessages.next(data);
    }
  }

  public showAlert(data:any){
    if(data){
      this.alert.next(data);
    }
  }



}