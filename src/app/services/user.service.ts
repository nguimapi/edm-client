import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private authService: AuthService) {}

    createUserFolder(userId: number, params: {name: string, folder_id: number}): any {
        return this.authService.post('users/' + userId + '/folders', params);
    }

    getUserFiles(userId: number): any {
        return this.authService.get('users/' + userId + '/files');
    }

    getUserFolder(userId: number, folderId: number): any {
        return this.authService.get('users/' + userId + '/folders/' + folderId);
    }

    getUserInformations(): any {
        return this.authService.get('users/me', {});
    }
}
