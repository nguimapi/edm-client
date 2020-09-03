import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private authService: AuthService) {}

    createUserFolder(userId: number, params: any): any {

        return this.authService.post('users/' + userId + '/folders', params);
    }

    updateUserFile(userId: number, fileId: any, params: any = {}): any {
		params._method = 'PUT';
        return this.authService.post('users/' + userId + '/files/' + fileId, params);
    }

    getUserFiles(userId: number, params: any = {}): any {
        return this.authService.get('users/' + userId + '/files', params);
    }

    getUserFolder(userId: number, folderId: number): any {
        return this.authService.get('users/' + userId + '/folders/' + folderId);
    }

    getUserInformations(): any {
        return this.authService.get('users/me', {});
    }
}
