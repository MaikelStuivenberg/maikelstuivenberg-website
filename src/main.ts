import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { AppModule } from './app/app.module';
import { bootstrapApplication } from '@angular/platform-browser';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
