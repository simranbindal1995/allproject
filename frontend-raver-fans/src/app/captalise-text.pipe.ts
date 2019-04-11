import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'captaliseText'
})
export class CaptaliseTextPipe implements PipeTransform {

  transform(value: any, words: boolean) {
    if (value) {
      if (words) {
        return value.replace(/\b\w/g, first => first.toLocaleUpperCase());
      } else {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
    }

    return value;
  }

}
