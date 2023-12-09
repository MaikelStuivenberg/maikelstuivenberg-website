import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

@NgModule({
  ...appConfig,
})
export class AppModule { }
