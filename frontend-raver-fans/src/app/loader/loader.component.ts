import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoaderService } from './loader-service';
import { LoaderState } from './loader';
@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {
    show = false;
    constructor(
        private loaderService: LoaderService
    ) { }
    ngOnInit() {
        this.loaderService.loaderObservable.subscribe((state: LoaderState) => {
            this.show = state.show;
        });
    }

}