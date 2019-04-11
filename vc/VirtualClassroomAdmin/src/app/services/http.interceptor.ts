import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs'
import { Injectable, Injector } from '@angular/core';
import swal from 'sweetalert2'

import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse }
    from '@angular/common/http';

import { Routes, RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
    public _auth: AuthService;
    constructor(private injector: Injector, private router: Router, ) {
        setTimeout(() => this._auth = injector.get(AuthService));
    }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {

        return next.handle(this.setAuthorizationHeader(request)).pipe(tap((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse) {
                if (event.body.statusCode && event.body.statusCode === 200) {
                    const token = event.headers.get('x-logintoken')
                    // console.log(token);
                    if (token) {
                        this._auth.storeUserInfo(event);
                    }
                    return event;
                } else if (event.body.statusCode && event.body.statusCode === 101) {
                    this._auth.removeUserInfo();
                    this.router.navigate(['/']);
                    return false;
                }
            }
        }), catchError((response) => {
            return throwError(response)
        })
        )

    }

    //Request Interceptor to append Authorization Header
    private setAuthorizationHeader(req: HttpRequest<any>): HttpRequest<any> {
        const Authorization = (JSON.parse(localStorage.getItem('userInfo')) === null || JSON.parse(localStorage.getItem('userInfo')) === undefined) ? '' : JSON.parse(localStorage.getItem('userInfo'));
        if (Authorization) {
            return req.clone({ setHeaders: { 'x-logintoken': (Authorization.token !== undefined) ? Authorization.token : '' } });
        }
        return req.clone({ setHeaders: { 'x-logintoken': (Authorization.token !== undefined) ? Authorization.token : '' } });
    }

}
