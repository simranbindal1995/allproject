import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClientJsonpModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SnotifyModule, SnotifyService, ToastDefaults, SnotifyPosition } from 'ng-snotify';
import { TimeAgoPipe } from 'time-ago-pipe';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChartsModule } from 'ng2-charts';
import { RatingModule } from 'ngx-bootstrap/rating';
import { NgxDynamicTemplateModule } from 'ngx-dynamic-template';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { AppRoutingModule } from './app-routing.module';
import { AppHttpInterceptor } from './app-http-interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaModule } from 'ng-recaptcha';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { RecaptchaFormsModule } from 'ng-recaptcha/forms';

//slick-slider
import { SlickModule } from 'ngx-slick';
// import services
import { AuthCheckService } from './auth-check.service';
import { AuthenticationService } from './authentication.service';
import { ApiCallsService } from './api-calls.service';
import { UniversalFunctionsService } from './universal-functions.service';
// import { RoleCheckServiceService } from './role-check-service.service';
import { PublicGuard, PrivateGuard } from './master.guard';
import { LandingComponent } from './landing/landing.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';


import { StateChangeService } from './stateChange.service';
import { BsModalService, ModalModule, BsDropdownModule, CollapseModule } from 'ngx-bootstrap';
import { BrandHomeComponent } from './brand-home/brand-home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RavelineComponent } from './raveline/raveline.component';

import { CapitalizefirstPipe } from './pipes/capitalizefirst.pipe';
import { ToMediaUrlPipe } from './pipes/to-media-url.pipe';

import { LoaderComponent } from './loader/loader.component';
import { LoaderService } from '../app/loader/loader-service';
// import { ImageCropperModule } from 'ngx-image-cropper';
import { ImageCropperComponent, CropperSettings } from 'ng2-img-cropper';

import { RaveRequestComponent } from './rave-request/rave-request.component';
import { CaptaliseTextPipe } from './captalise-text.pipe';

import { TagInputModule } from 'ngx-chips';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // this is needed!
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { SettingsComponent } from './settings/settings.component';
import { ControlPanelComponent } from './settings/control-panel/control-panel.component';
import { ManageStromComponent } from './settings/manage-strom/manage-strom.component';
import { DeclinedRaveComponent } from './settings/declined-rave/declined-rave.component';
import { RedemptionComponent } from './settings/redemption/redemption.component';
import { ChangePasswordComponent } from './settings/change-password/change-password.component';
import { ManageStromDetailComponent } from './settings/manage-strom-detail/manage-strom-detail.component';
import { AnalyticsComponent } from './settings/analytics/analytics.component';
import { AccountDetailsComponent } from './settings/account-details/account-details.component';
import { PaymentComponent } from './settings/payment/payment.component';
import { ManageRewardsComponent } from './settings/manage-rewards/manage-rewards.component';
import { BrandProfileComponent } from './brand-profile/brand-profile.component';
import { BrandProfilePostsComponent } from './brand-profile/brand-profile-posts/brand-profile-posts.component';
import { BrandProfileRatingComponent } from './brand-profile/brand-profile-rating/brand-profile-rating.component';
import { BrandProfileFollowersComponent } from './brand-profile/brand-profile-followers/brand-profile-followers.component';
import { BrandProfilePhotosComponent } from './brand-profile/brand-profile-photos/brand-profile-photos.component';
import { BrandDetailComponent } from './brand-detail/brand-detail.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { FollowerProfileComponent } from './follower-profile/follower-profile.component';
import { ProfileTabComponent } from './follower-profile/profile-tab/profile-tab.component';
import { AboutComponent } from './follower-profile/about/about.component';
import { NetworkComponent } from './follower-profile/network/network.component';
import { PhotosComponent } from './follower-profile/photos/photos.component';
import { NotificationsListComponent } from './notifications-list/notifications-list.component';
import { SupportComponent } from './support/support.component';
import { ModalComponent } from './modal/modal.component';
import { ShareModule } from '@ngx-share/core';
import { MessagingComponent } from './messaging/messaging.component';
import { AutoCompleteComponent } from './auto-complete/auto-complete.component';
import { SocketIoService } from './socket-io.service';
import { PreviousPaymentsComponent } from './settings/previous-payments/previous-payments.component';
import { CardsComponent } from './settings/cards/cards.component';
import { AddCardComponent } from './settings/add-card/add-card.component';
import { OtherBrandProfileComponent } from './other-brand-profile/other-brand-profile.component';
import { OtherBrandPhotosComponent } from './other-brand-profile/other-brand-photos/other-brand-photos.component';
import { OtherBrandNetworkComponent } from './other-brand-profile/other-brand-network/other-brand-network.component';
import { OtherBrandRatingComponent } from './other-brand-profile/other-brand-rating/other-brand-rating.component';
import { PaymentService } from './payment.service';
import { FaqComponent } from './faq/faq.component';
import { TermsComponent } from './terms/terms.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FanHomeComponent } from './fan-home/fan-home.component';
import { FanHowItWorksComponent } from './fan-how-it-works/fan-how-it-works.component';



@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LandingComponent,
    HowItWorksComponent,
    BrandHomeComponent,
    DashboardComponent,
    RavelineComponent,
    CapitalizefirstPipe,
    LoaderComponent,
    ToMediaUrlPipe,
    RaveRequestComponent,
    TimeAgoPipe,
    CaptaliseTextPipe,
    SettingsComponent,
    ControlPanelComponent,
    ManageStromComponent,
    DeclinedRaveComponent,
    RedemptionComponent,
    ChangePasswordComponent,
    ManageStromDetailComponent,
    AnalyticsComponent,
    AccountDetailsComponent,
    PaymentComponent,
    ManageRewardsComponent,
    BrandProfileComponent,
    BrandProfilePostsComponent,
    BrandProfileRatingComponent,
    BrandProfileFollowersComponent,
    BrandProfilePhotosComponent,
    BrandDetailComponent,
    ImageCropperComponent,
    ResetPasswordComponent,
    FollowerProfileComponent,
    ProfileTabComponent,
    AboutComponent,
    NetworkComponent,
    PhotosComponent,
    NotificationsListComponent,
    SupportComponent,
    ModalComponent,
    MessagingComponent,
    PreviousPaymentsComponent,
    CardsComponent,
    AutoCompleteComponent,
    AddCardComponent,
    OtherBrandProfileComponent,
    OtherBrandPhotosComponent,
    OtherBrandNetworkComponent,
    OtherBrandRatingComponent,
    FaqComponent,
    TermsComponent,
    PrivacyComponent,
    AboutUsComponent,
    UserProfileComponent,
    FanHomeComponent,
    FanHowItWorksComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientJsonpModule,
    FormsModule,
    ReactiveFormsModule,
    
    SnotifyModule,
    NgxPaginationModule,
    ChartsModule,

    CollapseModule.forRoot(),
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    TagInputModule,
    BrowserAnimationsModule,
    Ng4LoadingSpinnerModule.forRoot(),
    RatingModule.forRoot(),
    ShareModule.forRoot(),
    NgxDynamicTemplateModule.forRoot(),
    RecaptchaModule.forRoot(),
    RecaptchaFormsModule,
    FroalaEditorModule.forRoot(), FroalaViewModule.forRoot(),
    SlickModule.forRoot()
  ],
  providers: [
    StateChangeService,
    BsModalService,
    AuthCheckService,
    AuthenticationService,
    LoaderService,
    CapitalizefirstPipe,
    ToMediaUrlPipe,
    TimeAgoPipe,
    ApiCallsService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppHttpInterceptor,
      multi: true
    },
    {
      provide: 'SnotifyToastConfig',
      useValue: ToastDefaults
    },
    SnotifyService,
    SnotifyPosition,
    UniversalFunctionsService,
    PrivateGuard, PublicGuard, SocketIoService, PaymentService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
