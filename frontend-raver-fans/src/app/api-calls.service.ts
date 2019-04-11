import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class ApiCallsService {

  public BASE_URL: string;

  constructor(private http: HttpClient) {
    this.BASE_URL = "https://api.raverfans.com/v1/";

    // this.BASE_URL = "http://localhost:8046/v1/";
  }
  public getRequest(apiPath: string): any {
    var promise = new Promise((resolve, reject) => {
      this.http.get(this.BASE_URL + apiPath).subscribe(data => {
        resolve(data);
      },
        err => {
          //console.log('Error occured', err);
          reject(err);
        });
    });
console.log(promise)
    return promise;
  }

  public postRequest(apiPath: string, postData: any): any {
    var promise = new Promise((resolve, reject) => {
      this.http.post(this.BASE_URL + apiPath, postData, { observe: 'response' }).subscribe(data => {
        resolve(data);
      }, err => {
        //console.log('Error occured', err);
        reject(err);
      });
    });

    return promise;
  }


  public putRequest(apiPath: string, postData: any): any {
    var promise = new Promise((resolve, reject) => {
      this.http.put(this.BASE_URL + apiPath, postData).subscribe(data => {
        resolve(data);
      }, err => {
        //console.log('Error occured', err);
        reject(err);
      });
    });

    return promise;
  }

  public deleteRequest(apiPath: string, postData: any): any {
    var promise = new Promise((resolve, reject) => {////console.log("\n\n apis service==",this.BASE_URL + apiPath,postData)
      this.http.delete(this.BASE_URL + apiPath, postData).subscribe(data => {
        resolve(data);
      }, err => {
        //console.log('Error occured', err);
        reject(err);
      });
    });

    return promise;
  }
  public uploadMedia(url: string, file: any, is_video: string, chat_media: any) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_video', is_video);
    if (chat_media) {
      formData.append('chat_media', chat_media);
    }
    var promise = new Promise((resolve, reject) => {
      this.http.post(this.BASE_URL + url, formData).subscribe(data => {
        resolve(data);
      }, err => {
        //console.log('Error occured', err);
        reject(err);
      });
    });

    return promise;
  }

}
