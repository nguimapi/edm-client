"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUser = void 0;
var AuthUser = /** @class */ (function () {
    function AuthUser(id, name, last_name, gender, photo, email) {
        this.id = id;
        this.name = name;
        this.last_name = last_name;
        this.gender = gender;
        this.photo = photo;
        this.email = email;
    }
    return AuthUser;
}());
exports.AuthUser = AuthUser;
