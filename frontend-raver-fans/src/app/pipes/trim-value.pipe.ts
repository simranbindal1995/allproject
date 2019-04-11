import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trimValue'
})
export class TrimValuePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return null;
  }

}
