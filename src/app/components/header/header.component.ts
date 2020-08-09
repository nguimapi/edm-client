import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {TokenData} from '../../models/user';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private authService: AuthService,
              private router: Router,
              private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  logout(event): void {

    event.preventDefault();
    this.authService.logout().then(
      (data: TokenData) => {
        this.authService.storeValidToken(data, data.grant_type);
        this.router.navigate(['/login']).then(
          () => {
            this.authService.emitUser();
            this.toastr.info('You are now logged off');
          }
        );
      }
    );
  }

}
