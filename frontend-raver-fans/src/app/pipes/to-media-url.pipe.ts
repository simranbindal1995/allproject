import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toMediaUrl'
})
export class ToMediaUrlPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if(!value) return ""; //change
    return "https://api.raverfans.com/v1/Files/"+value+"?thumbnail="+(args?true:false);
  }

}
