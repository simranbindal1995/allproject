import { Injectable } from '@angular/core';
import * as Rx from 'rxjs/Rx';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';
import { environment } from '../environments/environment';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SocketIoService {


  private socket;
  private url = "https://api.raverfans.com";
  // private getMessageSubject = new Subject<any>();
  // getMessageObservable$ = this.getMessageSubject.asObservable();
  authenticatedUser: boolean = false;
  that: any;
  constructor() {
    this.socket = io(this.url);
    //console.log(" = ",this.socket)
   // this.checkConnection()
  }
  public checkConnection() {
    if (!this.authenticatedUser && JSON.parse(localStorage.getItem('access_token'))) {
      let that = this
      this.authenticateUser({
        'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
      }, function (err, res) {
        if (res) {
          that.authenticatedUser = true
        }
        //console.log("**************** connection established *****************")
      })
    }
  }
  public authenticateUser(query: Object, callback) {
    this.socket.emit('connectionServer', query, function (err, res) {
      //console.log("authenticated user")
      callback(err, res);
    })
  }
  public canChat(query: Object, callback) {
    this.socket.emit('canChat', query, function (err, res) {
      callback(err, res);
    })
  }
  public getInbox(query: Object, callback) {
    this.socket.emit('getInbox', query, function (err, res) {
      callback(err, res);
    })
  }
  public messageDeliveryReport = () => {
    return Observable.create((observer) => {
      this.socket.on('deliverResponse', (message) => {
        observer.next(message);
      });
    });
  }
  public getOnlineUsers = () => {
    return Observable.create((observer) => {
      this.socket.on('onlineUserResponse', (message) => {
        observer.next(message);
      });
    });
  }
  public getUnreadMessageCount = () => {
    return Observable.create((observer) => {
      this.socket.on('getUnreadCount', (message) => {
        observer.next(message);
      });
    });
  }
  public getOnlineUsersEmit(query: Object, callback) {
    this.socket.emit('getOnlineUsers', query, function (err, res) {
      callback(err, res);
    })
  }
  public getUnreadMessages(query: Object, callback) {
    this.socket.emit('getUnreadCount', query, function (err, res) {
      callback(err, res);
    })
  }
  public canFurtherChat = () => {
    return Observable.create((observer) => {
      this.socket.on('canFurtherChat', (message) => {
        observer.next(message);
      });
    });
  }
  public isUserTyping = () => {
    return Observable.create((observer) => {
      this.socket.on('checkTyping', (message) => {
        observer.next(message);
      });
    });
  }
  public receiveMessage = () => {
    return Observable.create((observer) => {
      this.socket.on('receiveMessage', (message) => {
        observer.next(message);
        
      });
    });
  }
  public messageDelivered(message: Object, callback) {
    this.socket.emit('delivered', message, function (err, res) {
      callback(err, res);
    })
  }
  public isTyping(message: Object, callback) {
    this.socket.emit('checkTyping', message, function (err, res) {
      callback(err, res);
    })
  }
  public sendAttachment(message: Object, callback) {
    this.socket.emit('sendAttachment', message, function (err, res) {
      callback(err, res);
    })
  }
  public sendMessage(message: Object, callback) {
    this.socket.emit('sendMessage', message, function (err, res) {
      callback(err, res);
    })
  }
  public markAllMessagesRead(query: Object, callback) {
    this.socket.emit('markAllRead', query, function (err, res) {
      callback(err, res);
    })
  }
  public getNotifications = () => {
    return Observable.create((observer) => {
      this.socket.on('NotificationsResponse', (message) => {
        observer.next(message);
      });
    });
  }
  public disconnect(message: Object, callback) {
    //console.log("disconnect event called")
    this.socket.emit('disconnectSocket', message, function (err, res) {
      callback(err, res);
    })
  }
  // public isTypingEvent(query: Object, callback) {
  //     this.socket.emit('sending_is_typing_Status', query, function (err, res) {
  //         callback(err, res);
  //     })
  // }
}