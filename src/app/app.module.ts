import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import {AuthService} from './services/auth.service';
import {AuthGuardService} from './services/auth-guard.service';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { routes } from './app-routing.module';
import {NotFoundComponent} from './components/not-found/not-found.component';
import { HomeComponent } from './components/home/home.component';
import { ToastrModule } from 'ngx-toastr';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { AppOneComponent } from './components/app-one/app-one.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    NotFoundComponent,
    HomeComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    AppOneComponent

  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, { useHash: false, preloadingStrategy: PreloadAllModules }),
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-top-center',
      preventDuplicates: true,
      maxOpened: 1

    }),
  ],
  providers: [
    AuthService,
    AuthGuardService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
