import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  menu(elem) {


    if (window.innerWidth < 990) {
      document.querySelector('body').classList.toggle("offcanvas-active");
    }

    else {
      document.querySelector('body').classList.toggle("layout-fullwidth");
    }
  }

}
