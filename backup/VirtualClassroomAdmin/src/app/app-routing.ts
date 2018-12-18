import { Routes, RouterModule, CanActivate } from '@angular/router';
/*auth guard service*/
import { AuthGuardGuard } from './services/auth-guard.guard';


/* ADMIN LAYOUT COMPONENTS */
import { AdminLoginComponent } from './layouts/admin-login/admin-login.component';
import { AdminDashboardComponent } from './layouts/admin-dashboard/admin-dashboard.component';

/*shared layout component*/
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FooterComponent } from './shared/footer/footer.component';


import { LoginComponent } from './views/login/login.component';
import { ForgotPasswordComponent } from './views/forgot-password/forgot-password.component';

/*admin view templates*/
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { UserMangementComponent } from './views/user-mangement/user-mangement.component';
import { RookieComponent } from './views/rookie/rookie.component';
import { SkillMangementComponent } from './views/skill-mangement/skill-mangement.component';
import { SkillListComponent } from './views/skill-list/skill-list.component';
import { DisputeMangementComponent } from './views/dispute-mangement/dispute-mangement.component';
import { PageMangementComponent } from './views/page-mangement/page-mangement.component';
import { PageEditComponent } from './views/page-edit/page-edit.component';
import { PaymentMangementComponent } from './views/payment-mangement/payment-mangement.component';
import { OneMonthComponent } from './views/payment-mangement/one-month/one-month.component';
import { OneWeekComponent } from './views/payment-mangement/one-week/one-week.component';
import { PaymentGroupComponent } from './views/payment-group/payment-group.component';

import { GroupOneMonthComponent } from './views/payment-group/group-one-month/group-one-month.component';
import { GroupOneWeekComponent } from './views/payment-group/group-one-week/group-one-week.component';
import { ChangePasswordComponent } from './views/change-password/change-password.component';
import { AddFaqComponent } from './views/add-faq/add-faq.component';
import { UpdateFaqComponent } from './views/update-faq/update-faq.component';
import { AddSubjectComponent } from './views/add-subject/add-subject.component';
import { AddCategoryComponent } from './views/add-category/add-category.component';

const appRoutes: Routes = [
    {
        path: '',
        component: AdminLoginComponent,
        children: [
            { path: '', component: LoginComponent, pathMatch: 'full' },
            { path: 'forgot-password', component: ForgotPasswordComponent, pathMatch: 'full' }
        ]
    },
    {
        path: '',
        component: AdminDashboardComponent,
        canActivate: [AuthGuardGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'usermangement', component: UserMangementComponent },
            { path: 'change-password', component: ChangePasswordComponent },
            { path: 'rokkies', component: RookieComponent },
            { path: 'skills', component: SkillMangementComponent },
            { path: 'skill-list', component: SkillListComponent },
            { path: 'disputemanagement', component: DisputeMangementComponent },
            { path: 'payment', component: PaymentMangementComponent },
            { path: 'payment-oneMonth', component: OneMonthComponent },
            { path: 'payment-oneWeek', component: OneWeekComponent },
            { path: 'payment-group', component: PaymentGroupComponent },
            { path: 'payment-group-oneMonth', component: GroupOneMonthComponent },
            { path: 'payment-group-oneWeek', component: GroupOneWeekComponent },
            { path: 'pagemanagement', component: PageMangementComponent },
            { path: 'page-edit/:type', component: PageEditComponent },
            { path: 'add-faq', component: AddFaqComponent },
            { path: 'update-faq/:id', component: UpdateFaqComponent },
            { path: 'add-subject', component: AddSubjectComponent },
            { path: 'add-category', component: AddCategoryComponent }

        ]
    },
    { path: '**', redirectTo: '' }
];
export const ROUTES = RouterModule.forRoot(appRoutes);
/*
######################
COMPONENTS WILL LOAD HERE 
#####################
*/
export const COMPONENTS = [
    AdminLoginComponent,
    AdminDashboardComponent,
    LoginComponent,
    ForgotPasswordComponent,
    DashboardComponent,
    NavbarComponent,
    SidebarComponent,
    UserMangementComponent,
    FooterComponent,
    RookieComponent,
    SkillMangementComponent,
    SkillListComponent,
    DisputeMangementComponent,
    PageMangementComponent,
    PageEditComponent,
    PaymentMangementComponent,
    OneMonthComponent,
    OneWeekComponent,
    PaymentGroupComponent,
    GroupOneMonthComponent,
    GroupOneWeekComponent,
    ChangePasswordComponent,
    AddFaqComponent,
    UpdateFaqComponent,
    AddSubjectComponent,
    AddCategoryComponent
];

export const PROVIDERS = [
]






