import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable()
export class CommonService {

  headers: Headers;
  options: RequestOptions;

  constructor(private http: HttpClient) {

    this.headers = new Headers({ 'Content-Type': 'application/json', 'Accept': 'q=0.8;application/json;q=0.9' });
    this.options = new RequestOptions({ headers: this.headers });

  }

  arrayObjectToString = function (data) {
    const out = [];
    for (var key in data) {
      out.push(key + '=' + encodeURIComponent(data[key]));
    }
    return out.join('&');
  };
  //post service
  postService(url: string, param: any): Observable<any> {
    let body = JSON.stringify(param);
    return this.http.post(url, body).pipe(map((res: Response) => res));
  }
  //get service
  getService(url: string, param: any, isParams: boolean): Observable<any> {

    let body = JSON.stringify(param);

    if (isParams == true) {

      return this.http.get
        (url + '?' + this.arrayObjectToString(param)).pipe(map((res: Response) => res));

    }

    else {
      return this.http.get(url).pipe(map((res: Response) => res));
    }

  }
  //update service
  putService(url: string, param: any): Observable<any> {

    let body = JSON.stringify(param);
    return this.http.put(url, body).pipe(map((res: Response) => res));
  }
}
