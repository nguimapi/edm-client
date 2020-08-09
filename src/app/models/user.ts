export class User {
    name?: string;
    last_name?: string;
    gender?: string;
    photo?: string;
    email: string;
    password?: string;

}

export class TokenData {
    token_type: string;
    expires_in: string;
    private _access_token: string;
    private _refresh_token: string;
    token_expires_at: any;
    grant_type?: string;

    get access_token() {
        return this._access_token;
    }

    get refresh_token() {
        return this._refresh_token;
    }

}
