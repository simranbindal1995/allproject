import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { TagInputModule } from 'ngx-chips';


import { NgBusyModule } from 'ng-busy';
import { AppRoutingModule } from './app-routing.module';
import { COMPONENTS } from './app-routing';

import { AppComponent } from './app.component';

/*ng-x bootstrap*/
import { BsDropdownModule } from 'ngx-bootstrap';
import { TabsModule } from 'ngx-bootstrap';
import { PaginationModule } from 'ngx-bootstrap';

/*chart-Module*/
import { ChartModule } from 'angular2-chartjs';






@NgModule({
  declarations: [
    AppComponent,
    COMPONENTS,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TagInputModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgBusyModule,
    ChartModule,
    BsDropdownModule.forRoot(),
    TabsModule.forRoot(),
    PaginationModule.forRoot(),
    FroalaEditorModule.forRoot(), FroalaViewModule.forRoot()

  ],
  providers: [],
  bootstrap: [AppComponent]
})


export class AppModule { }



