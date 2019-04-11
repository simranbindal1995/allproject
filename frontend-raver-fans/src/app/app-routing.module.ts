import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivate } from '@angular/router';
import { TimeAgoPipe } from 'time-ago-pipe';
// import components
import { LandingComponent } from './landing/landing.component'
import { HowItWorksComponent } from './how-it-works/how-it-works.component'
import { TermsComponent } from './terms/terms.component'
import { HeaderComponent } from '../app/header/header.component';
import { BrandHomeComponent } from '../app/brand-home/brand-home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RavelineComponent } from './raveline/raveline.component';
import { RaveRequestComponent } from './rave-request/rave-request.component';
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
import { MessagingComponent } from './messaging/messaging.component'
import { PreviousPaymentsComponent } from './settings/previous-payments/previous-payments.component';
import { CardsComponent } from './settings/cards/cards.component';
import { OtherBrandProfileComponent } from './other-brand-profile/other-brand-profile.component';
import { OtherBrandPhotosComponent } from './other-brand-profile/other-brand-photos/other-brand-photos.component';
import { OtherBrandNetworkComponent } from './other-brand-profile/other-brand-network/other-brand-network.component';
import { OtherBrandRatingComponent } from './other-brand-profile/other-brand-rating/other-brand-rating.component';
import { AddCardComponent } from './settings/add-card/add-card.component';
import { PrivacyComponent } from './privacy/privacy.component'
import { FaqComponent } from './faq/faq.component';
import { AboutUsComponent } from './about-us/about-us.component'
import { UserProfileComponent } from './user-profile/user-profile.component'
import { FanHomeComponent } from './fan-home/fan-home.component'
import { FanHowItWorksComponent } from './fan-how-it-works/fan-how-it-works.component';
// import { MessagingWindowComponent } from './messaging/messaging-window/messaging-window.component'
//import guards
import { PublicGuard, PrivateGuard } from './master.guard';



const appRoutes: Routes = [

  { path: 'landing', component: LandingComponent, canActivate: [PublicGuard] },
  { path: 'contact-us', component: LandingComponent },
  { path: 'notification-list', component: NotificationsListComponent, canActivate: [PrivateGuard] },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  { path: 'how-it-works', component: HowItWorksComponent },
  { path: 'fan-home', component: FanHomeComponent },
  { path: 'fan-how-it-works', component: FanHowItWorksComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'aboutUs', component: AboutUsComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'brand-home', component: BrandHomeComponent, canActivate: [PublicGuard] },
  {
    path: 'brand',
    component: BrandProfileComponent,
    canActivate: [PrivateGuard],
    children: [
      { path: 'profile', component: RavelineComponent, canActivate: [PrivateGuard] },
      { path: 'rating', component: BrandProfileRatingComponent, canActivate: [PrivateGuard] },
      { path: 'followers', component: BrandProfileFollowersComponent, canActivate: [PrivateGuard] },
      { path: 'photos', component: BrandProfilePhotosComponent, canActivate: [PrivateGuard] },
      { path: '', redirectTo: '/brand/profile', pathMatch: 'full' }
    ]
  },
  {
    path: 'follower',
    component: FollowerProfileComponent,
    canActivate: [PrivateGuard],
    children: [
      { path: 'profile/:id', component: ProfileTabComponent, canActivate: [PrivateGuard] },
      { path: 'about/:id', component: AboutComponent, canActivate: [PrivateGuard] },
      { path: 'network/:id', component: NetworkComponent, canActivate: [PrivateGuard] },
      { path: 'photos/:id', component: BrandProfilePhotosComponent, canActivate: [PrivateGuard] },
      { path: '', redirectTo: '/follower/profile/:id', pathMatch: 'full' }
    ]
  },
  {
    path: 'brands',
    component: OtherBrandProfileComponent,
    canActivate: [PrivateGuard],
    children: [
      { path: 'profile/:id', component: RavelineComponent, canActivate: [PrivateGuard] },
      { path: 'rating/:id', component: OtherBrandRatingComponent, canActivate: [PrivateGuard] },
      { path: 'followers/:id', component: OtherBrandNetworkComponent, canActivate: [PrivateGuard] },
      { path: 'photos/:id', component: OtherBrandPhotosComponent, canActivate: [PrivateGuard] },
      { path: '', redirectTo: '/brands/profile/:id', pathMatch: 'full' }
    ]
  },

  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [PrivateGuard],
    children: [{
        path: 'control-panel',
        component: ControlPanelComponent,
        canActivate: [PrivateGuard]
      },
      { path: 'manage-strom', component: ManageStromComponent, canActivate: [PrivateGuard] },
      { path: 'declined-raves', component: DeclinedRaveComponent, canActivate: [PrivateGuard] },
      { path: 'redemption', component: RedemptionComponent, canActivate: [PrivateGuard] },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [PrivateGuard] },
      { path: 'strom-detail/:id', component: ManageStromDetailComponent, canActivate: [PrivateGuard] },
      { path: 'analytics/:analytics_type', component: AnalyticsComponent, canActivate: [PrivateGuard] },
      { path: 'account-details', component: AccountDetailsComponent, canActivate: [PrivateGuard] },
      { path: 'payment-details', component: PaymentComponent, canActivate: [PrivateGuard] },
      { path: 'previous-payments', component: PreviousPaymentsComponent, canActivate: [PrivateGuard] },
      { path: 'cards', component: CardsComponent, canActivate: [PrivateGuard] },
      { path: 'add-card', component: AddCardComponent, canActivate: [PrivateGuard] },
      { path: 'manage-rewards', component: ManageRewardsComponent, canActivate: [PrivateGuard] },
      { path: '', redirectTo: '/settings/control-panel', pathMatch: 'full' }
    ]
  },


  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [PrivateGuard],
    children: [
      { path: 'raveline', component: RavelineComponent, canActivate: [PrivateGuard] },
      { path: 'rave/:tab', component: RaveRequestComponent, canActivate: [PrivateGuard] },
      { path: 'brand-detail', component: BrandDetailComponent, canActivate: [PrivateGuard] },
      { path: 'support', component: SupportComponent, canActivate: [PrivateGuard] },
      { path: 'my-posts', component: RavelineComponent, canActivate: [PrivateGuard] },
      { path: '', redirectTo: '/dashboard/raveline', pathMatch: 'full' }
    ]
  },
  {
    path: 'messaging',
    component: MessagingComponent,
    canActivate: [PrivateGuard]
  },
  {
    path: 'fans',
    component: FollowerProfileComponent,
    canActivate: [PrivateGuard],
    children: [
      { path: 'profile/:id', component: ProfileTabComponent, canActivate: [PrivateGuard] },
      { path: 'about/:id', component: AboutComponent, canActivate: [PrivateGuard] },
      { path: 'network/:id', component: NetworkComponent, canActivate: [PrivateGuard] },
      { path: 'photos/:id', component: BrandProfilePhotosComponent, canActivate: [PrivateGuard] },
      { path: '', redirectTo: '/fans/profile/:id', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: '**', redirectTo: '/landing' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes, {
        enableTracing: false // <-- debugging purposes only
      }
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
