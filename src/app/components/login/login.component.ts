import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ToastrService} from 'ngx-toastr';
import {ActivatedRoute, Router} from '@angular/router';
import {AccountService} from '../../services/account.service';
import {AuthService} from '../../services/auth.service';
import {AuthUser} from '../../models/auth-user.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    redirectTo: string;

    loginForm: FormGroup;
    loading = false;
    errors: any;
    formErrors;
    constructor(private toastr: ToastrService,
                private router: Router,
                private route: ActivatedRoute,
                private accountService: AccountService,
                private formBuilder: FormBuilder,
                private authService: AuthService) { }

    ngOnInit(): void {
        this.initForm();
        this.redirectTo = this.route.snapshot.queryParams.redirect_to || '/app';
    }

    initForm(): void {
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.min(6)]],
        });
    }

    doLogin(): void {
        if (!this.loginForm.invalid) {
            const email = this.loginForm.get('email').value;
            const password = this.loginForm.get('password').value;
            this.loading = true;

            this.accountService.login(email, password).then(
                (user: AuthUser) => {
                    this.authService.authUser = user;
                    this.authService.emitUser();

                    this.loading = false;
                    this.router.navigateByUrl(this.redirectTo).then(
                        () => {

                            this.toastr.success('Hello ' + user.name);
                        }
                    );

                },

                (error) => {
                    this.loading = false;

                    this.errors = error.error.error;
                }
            );
        } else {

            this.formErrors = this.loginForm.controls;
            return;
        }


    }




}
