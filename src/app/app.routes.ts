import { ContactComponent } from './contact/contact.component';
import { HomeComponent } from './home/home.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'privacy', component: PrivacyComponent },
    { path: 'contact', component: ContactComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' }
];