import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { HttpClientModule, HTTP_INTERCEPTORS , HttpClient } from '@angular/common/http';

import { MyHttpInterceptor } from './services/http.interceptor';

import { AuthService } from './services/auth.service';
import { AuthGuardGuard } from './services/auth-guard.guard';
import { CommonService } from './services/common.service';

import { ROUTES, COMPONENTS, PROVIDERS } from './app-routing';


@NgModule({
  imports: [
    CommonModule,
    ROUTES,
    HttpClientModule  
  ],
  exports: [RouterModule],
  providers: [
    AuthService,
    AuthGuardGuard,
    CommonService,
    PROVIDERS,
    { provide: HTTP_INTERCEPTORS, useClass: MyHttpInterceptor, multi: true }
  ],
  declarations: []
})
export class AppRoutingModule { }
