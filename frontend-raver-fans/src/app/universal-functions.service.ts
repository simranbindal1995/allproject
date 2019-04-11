import { Injectable } from '@angular/core';

@Injectable()
export class UniversalFunctionsService {

  public userInfo: any;

  constructor() {
    this.setUserInfo();
  }


  setUserInfo(): boolean {


    this.userInfo = JSON.parse(localStorage.getItem('userData'));

    return true;
  }

  dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }




}



