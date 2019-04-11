import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { LoaderService } from '../loader/loader-service'
import { SanitizeHtml, SanitizeResourceUrl, SanitizeScript, SanitizeStyle, SanitizeUrl } from 'ng2-sanitize';
@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit {
  termsData: any
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    private auth: AuthCheckService,
    private loader: LoaderService
  ) {

  }
  ngOnInit() {
    this.getTermsData()
  }

  getTermsData() {
    this.apiService.getRequest('Admin/getStaticPagesContent/2').then(
      (res) => {
        this.loader.hide()
        let bodyData = res
        if (bodyData.statusCode == 200) {
          var e = document.createElement('span');
          e.innerHTML = bodyData.data[0].content;
          document.getElementById('terms').appendChild(e);
          // this.termsData = bodyData.data[0].content
          // text:html = "<b>Welcome</b>";
        } else {
        }
      }, (err) => {
        //console.log("err", err)
      }

    );
  }
}
