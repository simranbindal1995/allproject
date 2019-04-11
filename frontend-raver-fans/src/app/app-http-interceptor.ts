import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import { SnotifyService } from 'ng-snotify';
import { UniversalFunctionsService } from './universal-functions.service';
import { AuthCheckService } from './auth-check.service';
import { LoaderService } from './loader/loader-service'
import { SocketIoService } from './socket-io.service'
import { StateChangeService } from './stateChange.service'
import { RouterModule, Router } from '@angular/router';
@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {



  constructor(
    private socket: SocketIoService,
    private broadcaster: StateChangeService, public router: Router,
    private loader: LoaderService,
    public utils: UniversalFunctionsService,
    private auth: AuthCheckService) {
    if (JSON.parse(localStorage.getItem('access_token'))) {
      this.socket.authenticateUser({
        'x-logintoken': JSON.parse(localStorage.getItem('access_token')).value
      }, function (err, res) {
        //console.log("**************** connection established ******")
      })
    };
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    ////console.log("called", this.loader)
    let that = this;
    if (this.auth.isLoggedIn()) {
      const authReq = req.clone({
        headers: req.headers.set("x-logintoken",
          JSON.parse(localStorage.getItem('access_token')).value
        )
      });
      return next.handle(authReq).do((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {

          if (event.body.statusCode == 324) { // session expired
            this.broadcaster.showAlert({
              modalType: 'error',
              message: event.body.message,
              timer: 2500,
              callback: function () { //only for success - warning - error
                //console.log("SESSION EXPIRED")
                localStorage.removeItem('userData'); localStorage.removeItem('access_token');
                that.router.navigate(['/landing']);
              },
            })
          } else if (event.body.statusCode == 323) { // user blocked
            this.broadcaster.showAlert({
              modalType: 'error',
              message: event.body.message,
              timer: 2500,
              callback: function () { //only for success - warning - error
                //console.log("SESSION EXPIRED")
                localStorage.removeItem('userData'); localStorage.removeItem('access_token');
                that.router.navigate(['/landing']);
              },
            })
          } else if (event.body.statusCode == 323) { // user blocked
            this.broadcaster.showAlert({
              modalType: 'error',
              message: event.body.message,
              timer: 2500,
              callback: function () { //only for success - warning - error
                //console.log("SESSION EXPIRED")
                localStorage.removeItem('userData'); localStorage.removeItem('access_token');
                that.router.navigate(['/landing']);
              },
            })
          } else if (event.body.statusCode != 200) {
            this.broadcaster.showAlert({
              modalType: 'warning',
              message: event.body.message,
              timer: 2500,
              callback: function () { //only for success - warning - error
                //console.log("callback function")
              },
            })
          }
        }
      }, (err: any) => {
        if (err instanceof HttpErrorResponse) {
          //console.log("err = ", err)


          this.broadcaster.showAlert({
            modalType: 'error',
            message: err.status ? err.message : 'Server is under maintainance. Please try later.',
            callback: function () { //only for success - warning - error
              //console.log("callback function")
              if (!err.status) {
                this.loader.hide();
                localStorage.removeItem('userData'); localStorage.removeItem('access_token');
                that.router.navigate(['/landing']);
              }
            },
          })
          //console.log('ERROR ON HTTP REQUEST : ' + err);
        }
      });
    } else {
      return next.handle(req).do((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
        }
      }, (err: any) => {
        if (err instanceof HttpErrorResponse) {
          // this.snotifyService.error("Please try again later", 'Server Error', {
          //   timeout: 3000,
          //   closeOnClick: true,
          //   pauseOnHover: true,
          //   showProgressBar: false
          // });
          //console.log('ERROR ON HTTP REQUEST : ' + err);
        }
      });
    }
  }
}
