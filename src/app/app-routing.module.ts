import { Routes } from '@angular/router';
import {LoginComponent} from './components/login/login.component';
import {AnonymousGuardService} from './services/anonymous-guard.service';
import {HomeComponent} from './components/home/home.component';
import {NotFoundComponent} from './components/not-found/not-found.component';
import {AppOneComponent} from './components/app-one/app-one.component';

export const routes: Routes = [
  {path: '', children: [
      { path: '', redirectTo: 'app', pathMatch: 'full'},
      { path: 'login', component: LoginComponent},
      {path: 'app', component: AppOneComponent, children: [
          { path: '', component: HomeComponent },
        ]
      },

      { path: 'not-found', component: NotFoundComponent },

      { path: '**', component: NotFoundComponent },

    ]
  },
];

