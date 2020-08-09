import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';
import {UserService} from './user.service';

@Injectable({
    providedIn: 'root'
})
export class AccountService {

    constructor(private authService: AuthService, private userService: UserService) {}

    login(email: string, password: string): any {

        return new Promise(
            (resolve, reject) => {
                this.authService.getPasswordToken(email, password).then(
                    (tokenData) => {
                        this.userService.getUserInformations().then(
                            (userData: any) => {
                                resolve(userData.data);
                            },
                            (error) => {
                                reject(error);
                            }
                        );
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        ) ;
    }


    logout(): any {
        this.authService.logout();

    }



}
