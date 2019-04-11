import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonService } from '../../services/common.service';
import { faq } from '../../models/faq';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-update-faq',
  templateUrl: './update-faq.component.html',
  styleUrls: ['./update-faq.component.css']
})
export class UpdateFaqComponent implements OnInit {

  public api: string = environment.apiUrl;
  public userModel: faq;
  public busy: Subscription;
  constructor(
    private commonService: CommonService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute
  ) {

    this.userModel = new faq();

  }

  getfaq() {
    let request = { question_id: this.route.snapshot.params.id }
    this.busy =
      this.commonService.getService(this.api + 'admin/fetch_particular_question', request, true)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.userModel = data.data;
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

  updatefaq() {
    this.busy =
      this.commonService.putService(this.api + 'admin/update_faq'
        , this.userModel)
        .subscribe(data => {
          if (data.statusCode == 200) {

            swal({
              position: 'top-end',
              type: 'success',
              title: data.message,
              showConfirmButton: false,
              timer: 1500
            }).then((result) => {
              this.router.navigate(['/pagemanagement']);
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
    this.getfaq();
  }


}
