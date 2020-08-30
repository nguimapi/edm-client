import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, LOCALE_ID } from '@angular/core';
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
import {ReactiveFormsModule} from '@angular/forms';
import {AnonymousGuardService} from './services/anonymous-guard.service';
import { HttpClientModule } from '@angular/common/http';
import { NgCircleProgressModule } from 'ng-circle-progress';
import {TruncatePipe} from './pipe/truncate.pipe';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        NotFoundComponent,
        HomeComponent,
        HeaderComponent,
        SidebarComponent,
        FooterComponent,
        AppOneComponent,
        TruncatePipe
    ],
    imports: [
        BrowserModule,
        RouterModule.forRoot(routes, {useHash: false, preloadingStrategy: PreloadAllModules}),
        ToastrModule.forRoot({
            timeOut: 2000,
            positionClass: 'toast-top-center',
            preventDuplicates: true,
            maxOpened: 1

        }),
        NgCircleProgressModule.forRoot({
            backgroundOpacity: 0.9,
            backgroundStroke: '#ffffff',
            backgroundStrokeWidth: 4,
            backgroundPadding: 35,
            radius: 20,
            space: -6,
            toFixed: 0,
            maxPercent: 100,
            unitsFontWeight: '500',
            outerStrokeWidth: 9,
            outerStrokeColor: '#1b84e7',
            outerStrokeLinecap: 'butt',
            innerStrokeWidth: 9,
            titleFontSize: '12',
            titleFontWeight: '900',
            subtitleFontWeight: '400',
            imageHeight: 117,
            imageWidth: 99,
            animationDuration: 0,
            showTitle: false,
            showSubtitle: false,
            showUnits: false,
            showInnerStroke: false,
            responsive: true,
            animation: true,
            showBackground: false,

        }),
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
    ],
    providers: [
        AuthService,
        AuthGuardService,
        AnonymousGuardService,
        { provide: LOCALE_ID, useValue: 'en' },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
