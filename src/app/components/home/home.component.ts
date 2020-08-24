import { Component, OnInit } from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {AuthUser} from "../../models/auth-user.model";
import {Subscription} from "rxjs";
import {UserService} from "../../services/user.service";
import * as moment from 'moment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  authUser: AuthUser;
  userSubscription: Subscription;
  files: any;
  loaded: boolean;

  constructor(private authService: AuthService,
              private userService: UserService) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.userSubject.subscribe(
      (authUser: AuthUser) => {
        this.authUser = authUser;

        if (authUser) {
          this.userService.getUserFiles(this.authUser.id).then(
            (response: any) => {

              this.files = response.data.data;
              this.loaded = true;
              console.log(response);

            }
          );
        }
      }
    );

    this.authService.emitUser();
  }

  getFileIconClass(file: any): string {
    switch (file.type) {
      case 'pdf':
        return 'fa fa-file-pdf-o';
      case 'png':
        return 'fa fa-file-image-o';

      case 'xlsx':
        return 'fa fa-file-excel-o';
      case 'word':
        return 'fa fa-file-word-o';
      case 'folder':
        return 'fa fa-folder-o';
    }
  }

  getCreatedAtHuman(file): string {

    return moment(file.created_at).fromNow();
  }

}
