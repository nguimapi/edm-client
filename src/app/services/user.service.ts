import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private authService: AuthService) {}

  getUserFiles(userId): any {
    return this.authService.get('users/' + userId + '/files');
  }

  getUserInformations(): any {
    return this.authService.get('users/me', {});
  }
}
