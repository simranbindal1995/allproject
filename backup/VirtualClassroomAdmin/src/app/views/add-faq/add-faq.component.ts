import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonService } from '../../services/common.service';
import { faq } from '../../models/faq';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-faq',
  templateUrl: './add-faq.component.html',
  styleUrls: ['./add-faq.component.css']
})

export class AddFaqComponent implements OnInit {

  public api: string = environment.apiUrl;
  public userModel: faq;
  public busy: Subscription;
  constructor(
    private commonService: CommonService,
    private location: Location
  ) {

    this.userModel = new faq();

  }

  addfaq() {
    this.userModel.question_id = "";
    console.log(this.userModel);

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

              location.reload()
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
