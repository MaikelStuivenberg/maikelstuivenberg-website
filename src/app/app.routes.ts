import { HomeComponent } from './home/home.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'privacy', component: PrivacyComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' }
];