import { Component, OnInit, TemplateRef, Input, Output, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  isCollapsed = true;
  brandInfo: any



constructor(private stateChangeService: StateChangeService,
  private appComponent: AppComponent,
  public apiService: ApiCallsService, public router: Router,
  public fb: FormBuilder,
  public route: ActivatedRoute,
  private auth: AuthCheckService,
) {
}
ngOnInit() {
  this.brandInfo = this.auth.getUserInfo()
}

logout() {
  this.apiService.postRequest('Users/logout', null).then(
    (res) => {
      localStorage.removeItem('userData'); localStorage.removeItem('access_token');
      this.router.navigate(['/landing']);
      return true;
    },
    (err) => {
      localStorage.removeItem('userData'); localStorage.removeItem('access_token');
      return true;
    }

  );
}
}
