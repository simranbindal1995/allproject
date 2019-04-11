import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonService } from '../../services/common.service';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';

import { subject } from '../../models/subject';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-subject',
  templateUrl: './add-subject.component.html',
  styleUrls: ['./add-subject.component.css']
})
export class AddSubjectComponent implements OnInit {
  public catrecords: any[];
  public busy: Subscription;
  public api: string = environment.apiUrl;
  public skills: any;
  public subjectModel: subject;

  constructor(
    private commonService: CommonService,
    private location: Location
  ) {
    this.subjectModel = new subject;
    this.skills = '';
  }

  //get all categorys
  getAllcategory() {

    this.busy =
      this.commonService.getService(this.api + 'subjectNSkill/getCategories', false, false)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.catrecords = data.data;
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

  //onsubject
  onsubject() {

    let skillsvalue = this.skills.toString();
    this.subjectModel.skill = skillsvalue;

    console.log(this.subjectModel);

    this.busy =
      this.commonService.postService(this.api + 'subjectNSkill/saveSubjectAndSKill'
        , this.subjectModel)
        .subscribe(data => {
          if (data.statusCode == 200) {
            swal({
              position: 'top-end',
              type: 'success',
              title: 'Saved successfull.',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              location.reload();
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
    this.getAllcategory();
  }

}
