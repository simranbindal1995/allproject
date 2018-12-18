import { Component, OnInit } from '@angular/core';

import { CommonService } from '../../services/common.service';

import { Skills } from '../../models/skills';
import swal from 'sweetalert2'
import { Subscription } from 'rxjs';


import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-skill-list',
  templateUrl: './skill-list.component.html',
  styleUrls: ['./skill-list.component.css']
})
export class SkillListComponent implements OnInit {
  public skillModel: Skills;
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
    private commonService: CommonService
  ) {
    this.skillModel = new Skills();
  }


  // get all skills
  getAllskills(pagination) {
    this.page = pagination.page;
    console.log(this.page);
    console.log(pagination);
    this.skip = this.page == 1 ? 0 : (this.page * this.limit) - this.limit;
    let request = { type: this.skillModel.added, skip: this.skip, limit: this.limit }
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


  ngOnInit() {
    this.getAllskills({ page: this.page, itemsPerPage: this.limit });
  }

}
