import { GenericSimplefinError } from "../errors.js"
import { HttpClient } from "../httpClient.ts"
import AccountSet from "../models/account-set.ts"


class SimplefinContextData {

    method: 'POST' | 'GET'
    port: number
    headers: any
    base64Token: string | undefined
    accessKey: string | undefined
    baseUrl: string | undefined
    username: string | undefined
    password: string | undefined
    queryString: string | undefined

    constructor(method: 'POST' | 'GET', port: number, headers: any = {}, base64Token: string | undefined = undefined) {
        this.method = method
        this.port = port
        this.headers = headers
        this.base64Token = base64Token
    }

    parseAccessKey(accessKey: string) {
        let scheme = null;
        let rest = null;
        let auth = null;
        let username = null;
        let password = null;
        let baseUrl = null;
        [scheme, rest] = accessKey.split('//');
        [auth, rest] = rest.split('@');
        [username, password] = auth.split(':');
        baseUrl = `${scheme}//${rest}`;

        this.username = username;
        this.password = password;
        this.baseUrl = baseUrl;
    }

    buildAuthHeader() {
        this.headers['Authorization'] = `Basic ${Buffer.from(
            `${this.username}:${this.password}`,
        ).toString('base64')}`;
    }

    buildAccountQueryString(startDate: Date, endDate: Date) {
        const params = [];
        let queryString = '';
        if (startDate) {
            params.push(`start-date=${this.normalizeDate(startDate)}`);
        }
        if (endDate) {
            params.push(`end-date=${this.normalizeDate(endDate)}`);
        }

        params.push(`pending=1`);

        if (params.length > 0) {
            queryString += '?' + params.join('&');
        }

        this.queryString = queryString;
    }

    accountsUrl() {
        if (this.queryString === undefined) {
            throw new GenericSimplefinError("Query string must be defined");
        }
        if (this.baseUrl === undefined) {
            throw new GenericSimplefinError("Base url must be defined.")
        }

        return `${this.baseUrl}/accounts/${this.queryString}`;
    }

    accessKeyUrl() {
        if (this.base64Token === undefined) {
            throw new GenericSimplefinError("Token must be defined before accessing accesKey endpoint.")
        }

        return Buffer.from(this.base64Token, 'base64').toString()
    }

    normalizeDate(date: Date) {
        return (date.valueOf() - date.getTimezoneOffset() * 60 * 1000) / 1000;
    }
}


interface SimpleFinApiInterface {
    fetchAccounts(startDate: Date, endDate: Date): Promise<AccountSet>;
    fetchAccessKey(): Promise<void>;
    setContext(context: SimplefinContextData): void
}


class SimplefinApi implements SimpleFinApiInterface {

    http_client: HttpClient
    context: SimplefinContextData | undefined

    constructor(http_client: any) {
        this.http_client = http_client
    }

    setContext(context: SimplefinContextData) {
        this.context = context
    }

    async fetchAccounts(startDate: Date, endDate: Date): Promise<AccountSet> {
        this.context.buildAccountQueryString(startDate, endDate);
        this.context.buildAuthHeader();
        const url = this.context.accountsUrl();

        let result = await this.http_client.request(url, {
            method: this.context.method,
            port: this.context.port,
            headers: this.context.headers,
        });

        return AccountSet.fromJson(result)

    }

    async fetchAccessKey() {
        const url = this.context.accessKeyUrl();
        try {
            let response = await this.http_client.request(url, {
                method: this.context.method,
                port: this.context.port,
                headers: this.context.headers,
            });
            this.context.accessKey = response
        } catch (error) {
            throw error
        }
    }

}


export { SimplefinApi, SimplefinContextData, SimpleFinApiInterface };