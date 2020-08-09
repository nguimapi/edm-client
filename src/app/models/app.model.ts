
export interface NavLink {
    title: string;
    link: string;
    queryParams?: any;
    isActive?: boolean;
}

export class MapCord {
    latitude?: number;
    longitude?: number;
    adress?: string;
    isLoading?: boolean;
}

export interface CurrencyModel {
    currency: string;
    text: string;
    increment: number;
    min: number;
    max: number;
    rates: any;
}

export class AppConfig {
    currency = 'EUR';
    defaultCurrencies: CurrencyModel[] = [];

    /*[
        {
            currency: 'XAF',
            text: 'XAF',
            increment: 500,
            min: 500,
            max: 6550000,
            rates: {
                XAF: 1,
                EUR: 655
            }
        },

        {
            currency: 'EUR',
            text: 'EURO',
            increment: 1,
            min: 1,
            max: 10000,
            rates: {
                EUR: 1,
                XAF: 0.0015267175572519
            }
        },
    ];*/
}
