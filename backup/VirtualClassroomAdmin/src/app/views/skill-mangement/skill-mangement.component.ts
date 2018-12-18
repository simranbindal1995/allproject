import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonService } from '../../services/common.service';

import { ApproveUser } from '../../models/approve-user';
import { Skills } from '../../models/skills';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';


import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-skill-mangement',
  templateUrl: './skill-mangement.component.html',
  styleUrls: ['./skill-mangement.component.css']
})
export class SkillMangementComponent implements OnInit {

  public skillModel: Skills;
  public approveModel: ApproveUser;
  public records: any[];
  public busy: Subscription;
  public api: string = environment.apiUrl;
  public assetUrl: string = environment.assetUrl;
  public search: string = '';

  public total: number;
  public page: number = 1;



  public skip: number = 0;
  public limit: number = 10;
  constructor(
    private commonService: CommonService,
    private location: Location
  ) {
    this.approveModel = new ApproveUser();
    this.skillModel = new Skills();
  }

  // get all skills
  getAllskills(pagination) {
    this.page = pagination.page;
    console.log(this.page);
    console.log(pagination);
    this.skip = this.page == 1 ? 0 : (this.page * this.limit) - this.limit;
    let request = { type: this.skillModel.requested, skip: this.skip, limit: this.limit }
    this.busy =
      this.commonService.getService(this.api + 'admin/skillManagement', request, true)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.records = data.data;
            this.total = data.totalRecords;
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

  //skill-verify
  //user-verify
  skillVerify(id, type) {
    this.approveModel.skill_id = id;
    this.approveModel.type = type;
    console.log(this.approveModel);
    this.busy =
      this.commonService.putService(this.api + 'admin/approveRejectSubject' + '?skill_id=' + this.approveModel.skill_id + '&type=' + this.approveModel.type
        , false)
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
    this.getAllskills({ page: this.page, itemsPerPage: this.limit });
  }

}
