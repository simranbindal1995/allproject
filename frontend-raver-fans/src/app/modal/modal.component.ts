import { Component, OnInit, EventEmitter, Output, Input, ElementRef } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  constructor(private elRef: ElementRef) {}

  ngOnInit() {

  }

  @Output() public confirmation = new EventEmitter < any > ();
  @Input() openButtonId: string;
  @Input() closeButtonId: string;


  private modalSettings: any = {}
  // private tempclass = this.name;
  public action(data) {
    this.modalSettings = data;
    if (Object.keys(data).length) { // action function called
      document.getElementById(this.closeButtonId).click(); // closes the previous opened alert modal
      setTimeout(() => {
        document.getElementById(this.openButtonId).click(); // opens the new alert modal
        if (data.modalType) { // checks if the modalType exists
          this.modalSettings = data;

          if (this.modalSettings.modalType != 'confirmation' && !this.modalSettings.hasOkayButton) { // if not confirmation popup, this closes the modal after the given timer parameter or after 2.5sec.  Also, if hasOkayButton is true, this allows modal to stay until user clicks the ok button. Once user clicks ok, okayClicked() is called
            setTimeout(() => {
              document.getElementById(this.closeButtonId).click();
              if (this.modalSettings.callback) {
                this.modalSettings.callback();
              }
            }, this.modalSettings.timer ? this.modalSettings.timer : 1500)
          }
        }
      }, 500)
    } else { // hide function called
      document.getElementById(this.closeButtonId).click();
    }
  }

  public okayClicked() {
    document.getElementById(this.closeButtonId).click();
    if (this.modalSettings.callback) {
      this.modalSettings.callback();
    }
  }

  public close() {
    document.getElementById(this.closeButtonId).click();
    document.querySelector('body').classList.remove('modal-open');
  }
  public confirm() {
    setTimeout(() => { this.confirmation.emit(this.modalSettings.params); }, 500)
    document.getElementById(this.closeButtonId).click();
    document.querySelector('body').classList.remove('modal-open');
  }

}
