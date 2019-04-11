import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import swal from 'sweetalert2'
import { Page } from '../../models/page';
import { CommonService } from '../../services/common.service';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-page-edit',
  templateUrl: './page-edit.component.html',
  styleUrls: ['./page-edit.component.css']
})
export class PageEditComponent implements OnInit {
  public pageType: any;
  public records: any[];
  public pageModel: Page;
  public busy: Subscription;
  public api: string = environment.apiUrl;
  public options: Object = {
    placeholderText: 'Page content....',
    charCounterCount: false,
    toolbarButtons: ['bold',
      'italic',
      'underline',
      'fontSize',
      'color',
      'inlineStyle',
      'paragraphStyle',
      '|',
      'paragraphFormat',
      'align',
      'formatOL',
      'formatUL',
      'outdent',
      'indent',
      'quote',
      '-',
      'insertLink',
      '|',
      'insertHR',
      'clearFormatting',
      '|',
      'html',
      '|',
      'undo',
      'redo']
  }
  constructor(private route: ActivatedRoute,
    private commonService: CommonService,
    private router: Router, ) {
    this.pageModel = new Page();
  }

  pageView() {
    let request = { page_type: this.route.snapshot.params.type }
    this.busy =
      this.commonService.getService(this.api + 'admin/static_pages_content', request, true)
        .subscribe(data => {
          if (data.statusCode == 200) {
            this.pageModel = data.data;

            this.records = data.data.questions_answers;
            console.log(this.records);
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


  pageUpdate() {
    let request = {
      content: this.pageModel.content,
      content_type: this.route.snapshot.params.type
    }
    this.busy = this.commonService.postService(this.api + 'admin/add_update_static_pages', request)
      .subscribe(data => {
        if (data.statusCode === 200) {
          swal({
            position: 'top-end',
            type: 'success',
            title: 'Page content updated successfully.',
            showConfirmButton: false,
            timer: 1500
          })
        } else {
          swal(data.message)
        }
      }, err => {
        swal(err.error.message)
      });
  }

  deleteFaq(id) {
    let request = {
      question_id: id
    }

    this.busy = this.commonService.putService(this.api + 'admin/delete_faq', request)
      .subscribe(data => {
        if (data.statusCode === 200) {
          swal({
            position: 'top-end',
            type: 'success',
            title: 'faq deletd successfully.',
            showConfirmButton: false,
            timer: 1500
          }).then((result) => {
            location.reload()
          })
        } else {
          swal(data.message)
        }
      }, err => {
        swal(err.error.message)
      });
  }


  ngOnInit() {
    this.pageType = { type: this.route.snapshot.params.type }
    this.pageView();
  }

}
