import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-auto-complete',
  templateUrl: './auto-complete.component.html',
  styleUrls: ['./auto-complete.component.scss']
})
export class AutoCompleteComponent implements OnInit {


  results: any[] = [];
  queryField: FormControl = new FormControl();
  constructor() {


  }

  ngOnInit() {
    this.queryField.valueChanges.debounceTime(200)
      .subscribe(result => {
        //console.log(result);
        if (result.trim()) {
          //do action here like call api and set data in results
        }

      })
  }


}
