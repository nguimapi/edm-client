"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenData = exports.User = void 0;
var User = /** @class */ (function () {
    function User() {
    }
    return User;
}());
exports.User = User;
var TokenData = /** @class */ (function () {
    function TokenData() {
    }
    Object.defineProperty(TokenData.prototype, "access_token", {
        get: function () {
            return this._access_token;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TokenData.prototype, "refresh_token", {
        get: function () {
            return this._refresh_token;
        },
        enumerable: false,
        configurable: true
    });
    return TokenData;
}());
exports.TokenData = TokenData;
