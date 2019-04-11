import { Component, OnInit, TemplateRef, Input, AfterViewInit, OnDestroy, ViewChildren, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { AuthCheckService } from '../auth-check.service';

import { Observable } from 'rxjs';
import 'rxjs/Rx';
import { Title } from '@angular/platform-browser';
import { ApiCallsService } from './../api-calls.service';
import { RouterModule, CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SnotifyService } from 'ng-snotify'
import { StateChangeService } from './../stateChange.service';
import { AppComponent } from './../app.component';
import { NgForm, FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { SocketIoService } from './../socket-io.service'
import { Element } from '@angular/compiler';
import { LoaderService } from './../loader/loader-service'
import { ModalComponent } from '../modal/modal.component'


@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  public sub: any
  user_id: any
  role: any
  constructor(private stateChangeService: StateChangeService,
    private appComponent: AppComponent,
    private socket: SocketIoService,
    public apiService: ApiCallsService, public router: Router,
    public fb: FormBuilder,
    public route: ActivatedRoute,
    public titleService: Title, private auth: AuthCheckService,
    private snotifyService: SnotifyService,
    private loader: LoaderService) {
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.user_id = params['id'];
    });
    this.apiService.getRequest('Users/getRole?user_id=' + this.user_id).then(
      (res) => {
        this.loader.hide();
        let bodyData = res

        if (res.statusCode == 200) {
          this.role = bodyData.data.role
          //  if (bodyData.data.role == 2) {
          //    this.role = bodyData.data.role
          //   } else if (bodyData.data.role == 1) {
          //   }

        } else {
        }
      }, (err) => {
      }
    );
  }

}
