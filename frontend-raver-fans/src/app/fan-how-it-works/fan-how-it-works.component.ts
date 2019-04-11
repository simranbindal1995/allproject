import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fan-how-it-works',
  templateUrl: './fan-how-it-works.component.html',
  styleUrls: ['./fan-how-it-works.component.scss']
})
export class FanHowItWorksComponent implements OnInit {


  constructor() { }

 public slideConfig = 
 {
"slidesToShow": 1, 
 "slidesToScroll": 1,   
 "dots": true,
 "asNavFor": '.slider-2'
};

public slideConfig2 =
{
  "slidesToShow":1,
  'focusOnSelect': true, 
  "slidesToScroll": 1,   
  "dots": false,
  "asNavFor": '.slider-1',
  'adaptiveHeight': true,
};



  ngOnInit() {
  }

}
