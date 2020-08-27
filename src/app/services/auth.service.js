"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
var core_1 = require("@angular/core");
var moment = require("moment");
var http_1 = require("@angular/common/http");
var rxjs_1 = require("rxjs");
var appSettings = require("src/app/env");
var AuthService = /** @class */ (function () {
    function AuthService(router, httpClient, toastr) {
        this.router = router;
        this.httpClient = httpClient;
        this.toastr = toastr;
        this.userSubject = new rxjs_1.Subject();
        this.isAuthSubject = new rxjs_1.Subject();
        this.tokenExistSubject = new rxjs_1.Subject();
        this.currentTokenSubject = new rxjs_1.Subject();
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
    AuthService.prototype.emitUser = function () {
        this.userSubject.next(this.authUser);
        this.isAuthSubject.next(this.isAuth);
    };
    AuthService.prototype.emitTokenExist = function () {
        this.tokenExistSubject.next(this.tokenExist);
    };
    AuthService.prototype.emitCurrentToken = function () {
        this.currentTokenSubject.next(this.currentToken);
    };
    AuthService.prototype.getCurrentToken = function () {
        return localStorage.getItem('current_token') != null ? JSON.parse(localStorage.getItem('current_token')) : null;
    };
    AuthService.prototype.getAuthUser = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.isAuth) {
                _this.get('users/me', {}).then(function (response) {
                    _this.authUser = response.data;
                    _this.isAuth = true;
                    _this.emitUser();
                    resolve(response.data);
                }, function (error) {
                    _this.isAuth = false;
                    _this.logout().then(function () {
                        _this.resolveAuthorization().then(function () {
                            _this.router.navigate(['/login']).then(function () {
                                _this.toastr.error('The authentication failed. Try again later.');
                            });
                        });
                    });
                    reject(error);
                    resolve(null);
                    console.log(error);
                });
            }
            resolve(null);
        });
    };
    AuthService.prototype.post = function (requestUrl, body) {
        var _this = this;
        if (body === void 0) { body = {}; }
        return new Promise(function (resolve, reject) {
            _this.getHeaders().then(function (headers) {
                _this.httpClient.post(_this.baseUri + requestUrl, body, { headers: headers, reportProgress: true }).subscribe(function (data) {
                    resolve(data);
                }, function (error) {
                    reject(error);
                });
            });
        });
    };
    AuthService.prototype.get = function (requestUrl, body) {
        var _this = this;
        if (body === void 0) { body = {}; }
        return new Promise(function (resolve, reject) {
            _this.getHeaders().then(function (headers) {
                _this.httpClient.get(_this.baseUri + requestUrl, { headers: headers, params: body }).subscribe(function (data) {
                    resolve(data);
                }, function (error) {
                    if (!_this.getCurrentToken() || !_this.getCurrentToken().grant_type) {
                        localStorage.removeItem('current_token');
                        _this.resolveAuthorization();
                    }
                    if (_this.getCurrentToken().grant_type === 'client_credentials' && error.error.code === 401) {
                        localStorage.removeItem('current_token');
                        _this.resolveAuthorization();
                    }
                    reject(error);
                });
            });
        });
    };
    AuthService.prototype.getHeaders = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.resolveAuthorization().then(function (accessToken) {
                var headers = new http_1.HttpHeaders({
                    Authorization: accessToken
                });
                resolve(headers);
            }, function (error) {
                reject(error);
            });
        });
    };
    AuthService.prototype.getUserInformation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.get('users/me', {}).then(function (user) {
                resolve(user);
            }, function () {
                resolve(null);
            });
        });
    };
    AuthService.prototype.getClientCredentialToken = function () {
        return this.httpClient.post(this.baseUri + 'oauth/token', {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });
    };
    AuthService.prototype.refreshAuthenticatedUserToken = function (currentToken) {
        return this.httpClient.post(this.baseUri + 'oauth/token', {
            grant_type: 'refresh_token',
            client_id: this.passwordClientId,
            client_secret: this.passwordClientSecret,
            refresh_token: currentToken.refresh_token,
        });
    };
    AuthService.prototype.resolveAuthorization = function () {
        var _this = this;
        var currentToken = localStorage.getItem('current_token') != null ? JSON.parse(localStorage.getItem('current_token')) : null;
        return new Promise(function (resolve, reject) {
            if (_this.existingValidToken()) {
                resolve(_this.existingValidToken());
                return;
            }
            if (_this.isAuth && currentToken != null && currentToken.refresh_token) {
                _this.refreshAuthenticatedUserToken(currentToken).subscribe(function (data) {
                    _this.storeValidToken(data, data.grant_type);
                    resolve(data.access_token);
                    return;
                }, function (error) {
                    console.log(error);
                    _this.logout().then(function (tokenData) {
                        _this.storeValidToken(tokenData, tokenData.grant_type);
                        _this.router.navigate(['/login']).then(function () {
                            _this.toastr.error('The authentication failed. Try again later.');
                        });
                    }, function (error1) {
                        reject(error1);
                    });
                });
            }
            else {
                _this.getClientCredentialToken().subscribe(function (data) {
                    _this.storeValidToken(data, 'client_credentials');
                }, function (error) {
                    reject(error);
                });
            }
        });
    };
    AuthService.prototype.getPasswordToken = function (userName, pass) {
        var _this = this;
        var params = {
            grant_type: 'password',
            client_id: this.passwordClientId,
            client_secret: this.passwordClientSecret,
            username: userName,
            password: pass,
            base: this.baseUri,
        };
        return new Promise(function (resolve, reject) {
            _this.httpClient.post(_this.baseUri + 'oauth/token', params).subscribe(function (data) {
                resolve(data);
            }, function (error) {
                reject(error);
            });
        }).then(function (data) {
            _this.storeValidToken(data, 'password');
            _this.isAuth = true;
        });
    };
    AuthService.prototype.storeValidToken = function (tokenData, grantType) {
        if (tokenData === void 0) { tokenData = {}; }
        tokenData.token_expires_at = moment().add(tokenData.expires_in - 5, 'seconds').format();
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
    };
    AuthService.prototype.existingValidToken = function () {
        var tokenData;
        if (localStorage.getItem('current_token') !== null) {
            tokenData = JSON.parse(localStorage.getItem('current_token'));
            var tokenExpiresAt = moment(tokenData.token_expires_at);
            if (moment().isBefore(tokenExpiresAt)) {
                this.currentToken = tokenData;
                return tokenData.access_token;
            }
        }
        return false;
    };
    AuthService.prototype.logout = function () {
        var _this = this;
        return new Promise(function (resolve) {
            localStorage.removeItem('current_token');
            _this.isAuth = false;
            _this.authUser = null;
            _this.getClientCredentialToken().subscribe(function (data) {
                resolve(data);
            });
        });
    };
    AuthService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;
