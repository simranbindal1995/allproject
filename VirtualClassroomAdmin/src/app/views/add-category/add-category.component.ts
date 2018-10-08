import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonService } from '../../services/common.service';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from "@angular/router";

import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent implements OnInit {

  public categoryname: string;
  public busy: Subscription;
  public api: string = environment.apiUrl;

  constructor(
    private commonService: CommonService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }


  onadd() {
    let request = { name: this.categoryname }
    //console.log(request);
    this.busy =
      this.commonService.postService(this.api + 'subjectNSkill/saveCategory'
        , request)
        .subscribe(data => {
          if (data.saveCategoryInDb.statusCode == 200) {
            swal({
              position: 'top-end',
              type: 'success',
              title: data.message,
              showConfirmButton: false,
              timer: 1500
            }).then((result) => {
              this.router.navigate(['/add-subject']);
            })
          }
          else {
            swal(data.message)
          }
        }, err => {
          swal({
            text: err.message,
            type: 'error'
          });
        })
  }

  ngOnInit() {
  }

}
