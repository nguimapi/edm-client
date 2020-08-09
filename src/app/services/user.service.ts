import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private authService: AuthService) {}

    getUserInformations() {
        return this.authService.get('users/me', {});
    }

    createUser(user: FormData) {
        return this.authService.post('users', user);
    }

    getUser(id) {
        return this.authService.get('users' + '/' + id);
    }

    public editProfil(data, id) {
        return this.authService.post('users/' + id, data);

    }
}
