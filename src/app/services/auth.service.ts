import {Injectable} from '@angular/core';
import {TokenData} from '../models/user';
import * as moment from 'moment';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Subject} from 'rxjs';
import * as appSettings from 'src/app/env';
import {ResponseMessage} from '../models/response-message.model';
import {AuthUser} from '../models/auth-user.model';
import {ToastrService} from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authUser: AuthUser;

  userSubject = new Subject<any>();
  isAuthSubject = new Subject<boolean>();
  tokenExistSubject = new Subject<boolean>();
  currentTokenSubject = new Subject<boolean>();

  currentToken: any;
  accessToken: string;
  isAuth: boolean;
  tokenExist: boolean;

  /**
   *  The URL to send the request
   */
  baseUri: string;

  /**
   * The client id to identify the client in ther API
   */
  protected clientId: number;

  /**
   * The client secret to identify the client in ther API
   */
  protected clientSecret: string;

  /**
   * The client id to identify the password client in ther API
   */
  protected passwordClientId: number;

  /**
   * The client secret to identify the password client in the API
   */
  protected passwordClientSecret: string;

  constructor(private router: Router,
              private httpClient: HttpClient,
              private toastr: ToastrService) {

    this.baseUri = appSettings.BASE_URL_API;
    this.baseUri = appSettings.BASE_URL_API;
    this.clientId = appSettings.PASSPORT.client_id;
    this.clientSecret = appSettings.PASSPORT.client_secret;
    this.passwordClientId = appSettings.PASSPORT.passport_client_id;
    this.passwordClientSecret = appSettings.PASSPORT.passport_client_secret;
    this.currentToken = this.getCurrentToken();
    this.isAuth = this.currentToken != null && this.currentToken.grant_type === 'password';
    this.tokenExist = this.currentToken != null;
  }

  emitUser(): any {
    this.userSubject.next(this.authUser);
    this.isAuthSubject.next(this.isAuth);
  }

  emitTokenExist(): any {
    this.tokenExistSubject.next(this.tokenExist);
  }


  emitCurrentToken(): any {
    this.currentTokenSubject.next(this.currentToken);
  }

  getCurrentToken(): any {
    return localStorage.getItem('current_token') != null ? JSON.parse(localStorage.getItem('current_token')) : null;
  }

  getAuthUser(): any {

    return new Promise<AuthUser>(
      (resolve, reject) => {
        if (this.isAuth) {
          this.get('users/me', {}).then(
            (response: ResponseMessage) => {
              this.authUser = response.data;
              this.isAuth = true;
              this.emitUser();
              resolve(response.data);

            },

            (error) => {
              this.isAuth = false;
              this.logout().then(
                () => {
                  this.resolveAuthorization().then(
                    () => {
                      this.router.navigate(['/login']).then(
                        () => {
                          this.toastr.error('The authentication failed. Try again later.');
                        }
                      );
                    }
                  );
                }
              );
              reject(error);
              resolve(null);

              console.log(error);

            }
          );
        }

        resolve(null);

      }
    );
  }

  post(requestUrl: string, body: any = {}): any {
    return new Promise(
      (resolve, reject) => {
        this.getHeaders().then(
          (headers: HttpHeaders) => {
            this.httpClient.post(this.baseUri + requestUrl, body, {headers, reportProgress: true}).subscribe(
              data => {
                resolve(data);
              },
              error => {
                reject(error);
              }
            );
          }

        );

      }
    );
  }

  get(requestUrl: string, body: any = {}): Promise<unknown> {
    return new Promise(
      (resolve, reject) => {
        this.getHeaders().then(
          (headers: HttpHeaders) => {
            this.httpClient.get(this.baseUri + requestUrl, {headers, params: body}).subscribe(
              data => {
                resolve(data);
              },
              error => {
                if (!this.getCurrentToken() || !this.getCurrentToken().grant_type) {
                  localStorage.removeItem('current_token');
                  this.resolveAuthorization();
                }

                if (this.getCurrentToken().grant_type === 'client_credentials' && error.error.code === 401) {
                  localStorage.removeItem('current_token');
                  this.resolveAuthorization();
                }
                reject(error);

              }
            );
          }

        );

      }
    );

  }

  getHeaders(): Promise<unknown> {

    return new Promise(
      (resolve, reject) => {

        this.resolveAuthorization().then(
          (accessToken: string) => {

            const headers = new HttpHeaders({
              Authorization: accessToken
            });

            resolve(headers);

          },

          (error) => {
            reject(error);

          }
        );
      }
    );
  }

  getUserInformation(): Promise<unknown> {

    return new Promise(
      (resolve, reject) => {
        this.get('users/me', {}).then(
          (user) => {

            resolve(user);
          },

          () => {
            resolve (null);
          }
        );

      }
    );
  }

  getClientCredentialToken(): any {

    return this.httpClient.post<TokenData>(this.baseUri + 'oauth/token', {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }

  refreshAuthenticatedUserToken(currentToken): any {

    return this.httpClient.post<TokenData>(this.baseUri + 'oauth/token', {
      grant_type: 'refresh_token',
      client_id: this.passwordClientId,
      client_secret: this.passwordClientSecret,
      refresh_token: currentToken.refresh_token,
    });
  }


  resolveAuthorization(): any {
    const currentToken = localStorage.getItem('current_token') != null ? JSON.parse(localStorage.getItem('current_token')) : null;

    return new Promise(
      (resolve, reject) => {

        if (this.existingValidToken()) {
          resolve(this.existingValidToken());
          return;
        }
        if (this.isAuth && currentToken != null && currentToken.refresh_token) {

          this.refreshAuthenticatedUserToken(currentToken).subscribe(
            data => {
              this.storeValidToken(data, data.grant_type);
              resolve(data.access_token);
              return;
            },
            (error: any) => {

              console.log(error);
              this.logout().then(
                (tokenData: TokenData) => {
                  this.storeValidToken(tokenData, tokenData.grant_type);
                  this.router.navigate(['/login']).then(
                    () => {
                      this.toastr.error('The authentication failed. Try again later.');
                    }
                  );
                },

                error1 => {

                  reject(error1);
                }
              );
            }
          );
        } else {

          this.getClientCredentialToken().subscribe(
            (data) => {
              this.storeValidToken(data, 'client_credentials');

            },

            (error) => {
              reject(error);
            }
          );
        }
      }
    );
  }

  getPasswordToken(userName: string, pass: string): any {
    const params = {
      grant_type: 'password',
      client_id: this.passwordClientId,
      client_secret: this.passwordClientSecret,
      username: userName,
      password: pass,
      base: this.baseUri,
      // scope: 'purchase-product manage-products manage-account read-general',

    };

    return new Promise(
      (resolve, reject) => {

        this.httpClient.post(this.baseUri + 'oauth/token', params).subscribe((data) => {
            resolve(data);
          },

          (error) => {
            reject(error);
          }
        );
      }
    ).then(
      (data: TokenData) => {
        this.storeValidToken(data, 'password');
        this.isAuth = true;
      }
    );

  }

  storeValidToken(tokenData: any = {}, grantType): void {

    tokenData.token_expires_at = moment().add(tokenData.expires_in - 5, 'seconds' ).format();
    tokenData.access_token = tokenData.token_type + ' ' + tokenData.access_token;
    tokenData.grant_type = grantType;

    localStorage.setItem('current_token', JSON.stringify(tokenData));
    this.currentToken = tokenData;
    this.accessToken = tokenData.access_token;

    if (grantType === 'password') {
      this.isAuth = true;
      this.emitUser();
    }

    this.tokenExist = true;
    this.emitCurrentToken();
    this.emitTokenExist();
  }

  existingValidToken(): any {

    let tokenData;

    if (localStorage.getItem('current_token') !== null) {

      tokenData = JSON.parse(localStorage.getItem('current_token'));

      const tokenExpiresAt = moment(tokenData.token_expires_at);

      if (moment().isBefore(tokenExpiresAt)) {

        this.currentToken = tokenData;
        return tokenData.access_token;

      }
    }

    return false;
  }

  logout(): any {

    return new Promise(
      (resolve) => {
        localStorage.removeItem('current_token');
        this.isAuth = false;
        this.authUser = null;

        this.getClientCredentialToken().subscribe(
          (data: TokenData) => {
            resolve(data);
          },

        );
      }
    );

  }
}
