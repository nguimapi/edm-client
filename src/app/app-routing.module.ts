import { Routes } from '@angular/router';
import {LoginComponent} from './components/login/login.component';
import {AnonymousGuardService} from './services/anonymous-guard.service';
import {HomeComponent} from './components/home/home.component';
import {NotFoundComponent} from './components/not-found/not-found.component';
import {AppOneComponent} from './components/app-one/app-one.component';
import {AuthGuardService} from './services/auth-guard.service';

export const routes: Routes = [
  {path: '', children: [
      { path: '', redirectTo: 'app/home', pathMatch: 'full'},
      { path: 'login', component: LoginComponent, canActivate: [AnonymousGuardService]},
      {path: 'app', component: AppOneComponent, canActivate: [AuthGuardService],

        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full'},
          { path: ':path', component: HomeComponent },
          { path: ':path/:id', component: HomeComponent },
        ]
      },

      { path: 'not-found', component: NotFoundComponent },

      { path: '**', component: NotFoundComponent },

    ]
  },
];

