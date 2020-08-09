export class User {
    name?: string;
    lastname?: string;
    phone?: string;
    adress?: string;
    email: string;
    password?: string;
    photo?: string;
    types?: string;
    social_register?: string;
    provider: string;
    provider_id: string; // provider_id

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

export class SocialUser {
    provider: string;
    id: string;
    email: string;
    name: string;
    image: string;
    token?: string;
    idToken?: string;
}

export interface Changed {
    id?: any;
    oldpassword?: string;
    newpassword?: string;
    newpassword_confirmation?: string;

}

export interface Edit {
    id?: any;
    name: string;
    lastname?: string;
    phone?: string;
    adress?: string;
    email: string;

}

export class SuggestedUser {
    id: number;
    full_name: string;
    email: string;
    photo: string;
    country: string;
    city: string;
    userType?: string;
    status?: string = null;
    isSaved?: boolean = false;
    hasContract?: boolean = false;
    resendingInvitation?: boolean = false;
    sendingInvitation?: boolean = false;
    hasResendInvitation?: boolean = false;
    hasSendInvitation?: boolean = false;
    cancelingInvitation?: boolean = false;
    hasCanceledInvitation?: boolean = false;
    isBeenRemoved?: boolean = false;
    isSigningContract?: boolean = false;
    hasBeenRemoved?: boolean = false;
    successMessage?: string ;
    errorMessage?: string;
}
