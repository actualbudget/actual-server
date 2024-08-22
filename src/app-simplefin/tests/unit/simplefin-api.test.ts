import { GenericSimplefinError } from '../../errors.ts';
import {
  SimplefinApi,
  SimplefinContextData,
} from '../../services/simplefin-api.ts';
import { CustomRequestOptions, HttpClient } from '../../httpClient.ts';
import AccountSet from '../../models/account-set.ts';

describe('SimplefinContextData', () => {
  const simplefinBase64Token =
    'aHR0cHM6Ly9icmlkZ2Uuc2ltcGxlZmluLm9yZy9zaW1wbGVmaW4vY2xhaW0vZGVtbw==';

  it('should initialize with correct values', () => {
    const context = new SimplefinContextData(
      'GET',
      8080,
      { 'Content-Type': 'application/json' },
      simplefinBase64Token,
    );
    expect(context.method).toBe('GET');
    expect(context.port).toBe(8080);
    expect(context.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(context.base64Token).toBe(simplefinBase64Token);
  });

  it('should parse access key correctly', () => {
    const context = new SimplefinContextData('GET', 8080);
    context.parseAccessKey('http://username:password@mybank.com');
    expect(context.username).toBe('username');
    expect(context.password).toBe('password');
    expect(context.baseUrl).toBe('http://mybank.com');
  });

  it('should build authorization header correctly', () => {
    const context = new SimplefinContextData('GET', 8080);
    context.username = 'username';
    context.password = 'password';
    context.buildAuthHeader();
    expect(context.headers['Authorization']).toBe(
      'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
    );
  });

  it('should build account query string correctly', () => {
    const context = new SimplefinContextData('GET', 8080);
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    context.buildAccountQueryString(startDate, endDate);
    expect(context.queryString).toBe(
      '?start-date=1672534800&end-date=1675126800&pending=1',
    );
  });

  it('should throw error if query string is undefined in accountsUrl', () => {
    const context = new SimplefinContextData('GET', 8080);
    expect(() => context.accountsUrl()).toThrow(GenericSimplefinError);
  });

  it('should throw error if base url is undefined in accountsUrl', () => {
    const context = new SimplefinContextData('GET', 8080);
    context.queryString =
      '?start-date=1672531200&end-date=1675123200&pending=1';
    expect(() => context.accountsUrl()).toThrow(GenericSimplefinError);
  });

  it('should return correct accounts URL', () => {
    const context = new SimplefinContextData('GET', 8080);
    context.queryString =
      '?start-date=1672531200&end-date=1675123200&pending=1';
    context.baseUrl = 'http://mybank.com';
    expect(context.accountsUrl()).toBe(
      'http://mybank.com/accounts/?start-date=1672531200&end-date=1675123200&pending=1',
    );
  });

  it('should throw error if base64Token is undefined in accessKeyUrl', () => {
    const context = new SimplefinContextData('GET', 8080);
    expect(() => context.accessKeyUrl()).toThrow(GenericSimplefinError);
  });

  it('should return correct access key URL', () => {
    const context = new SimplefinContextData(
      'GET',
      8080,
      {},
      simplefinBase64Token,
    );
    expect(context.accessKeyUrl()).toBe(
      'https://bridge.simplefin.org/simplefin/claim/demo',
    );
  });

  it('should normalize date correctly', () => {
    const context = new SimplefinContextData('GET', 8080);
    const date = new Date('2023-01-01T00:00:00Z');
    expect(context.normalizeDate(date)).toBe(1672534800);
  });
});

class FakeHttpClient implements HttpClient {
  private responses: { [url: string]: string | Error } = {};

  requests: { url: string; options: CustomRequestOptions }[] = [];

  setResponse(url: string, response: string | Error) {
    this.responses[url] = response;
  }

  async request(url: string, options: CustomRequestOptions): Promise<string> {
    const response = this.responses[url];

    if (!response) {
      throw Error(`No response set for URL: ${url}`);
    }

    if (this.responses[url] instanceof Error) {
      return Promise.reject(this.responses[url]);
    }
    this.requests.push({ url, options });
    return Promise.resolve(this.responses[url]);
  }
}

describe('SimplefinApi', () => {
  let fakeHttpClient: FakeHttpClient;
  let simplefinApi: SimplefinApi;
  const simplefinBase64Token =
    'aHR0cHM6Ly9icmlkZ2Uuc2ltcGxlZmluLm9yZy9zaW1wbGVmaW4vY2xhaW0vZGVtbw==';
  const simplefinAccessKey =
    'https://user123:pass456@bridge.simplefin.org/simplefin';
  let accessKeyContext: SimplefinContextData;
  let accountContext: SimplefinContextData;

  beforeEach(() => {
    fakeHttpClient = new FakeHttpClient();
    simplefinApi = new SimplefinApi(fakeHttpClient);
    accessKeyContext = new SimplefinContextData(
      'POST',
      443,
      { 'Content-Length': '0' },
      simplefinBase64Token,
    );
    accountContext = new SimplefinContextData('GET', 443);
  });

  it('should set context correctly', () => {
    const context = new SimplefinContextData(
      'GET',
      8080,
      { 'Content-Type': 'application/json' },
      simplefinBase64Token,
    );
    simplefinApi.setContext(context);
    expect(simplefinApi.context).toBe(context);
  });

  it('should fetch accounts correctly', async () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');

    const fakeResponse = `{
      "errors": [],
      "accounts": [
        {
          "org": {
            "domain": "mybank.com",
            "sfinUrl": "https://sfin.mybank.com"
          },
          "id": "2930002",
          "name": "Savings",
          "currency": "USD",
          "balance": "100.23",
          "availableBalance": "75.23",
          "balanceDate": 978366153,
          "transactions": [
            {
              "id": "12394832938403",
              "posted": 793090572,
              "amount": "-33293.43",
              "description": "Uncle Frank's Bait Shop"
            }
          ],
          "extra": {
            "accountOpenDate": 978360153
          }
        }
      ]
    }`;

    const expectedAccountSet = AccountSet.fromJson(fakeResponse);

    // Make sure start/end dates got normalized, and that the URL got correctly built
    fakeHttpClient.setResponse(
      'https://bridge.simplefin.org/simplefin/accounts/?start-date=1672534800&end-date=1675126800&pending=1',
      fakeResponse,
    );

    accountContext.parseAccessKey(simplefinAccessKey);
    simplefinApi.setContext(accountContext);
    const result = await simplefinApi.fetchAccounts(startDate, endDate);

    // Make sure that the response was correctly parsed
    expect(result).toEqual(expectedAccountSet);

    // Make sure that the request was made with the correct URL, and options
    expect(fakeHttpClient.requests).toEqual([
      {
        options: {
          headers: {
            Authorization: 'Basic dXNlcjEyMzpwYXNzNDU2',
          },
          method: 'GET',
          port: 443,
        },
        url: 'https://bridge.simplefin.org/simplefin/accounts/?start-date=1672534800&end-date=1675126800&pending=1',
      },
    ]);
  });

  it('should fetch access key correctly', async () => {
    fakeHttpClient.setResponse(
      'https://bridge.simplefin.org/simplefin/claim/demo',
      simplefinAccessKey,
    );
    simplefinApi.setContext(accessKeyContext);
    await simplefinApi.fetchAccessKey();

    // Make sure that the context was correctly updated with the access key
    expect(simplefinApi.context.accessKey).toBe(simplefinAccessKey);
  });

  it('should handle error when fetching accounts', async () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    accountContext.parseAccessKey(simplefinAccessKey);
    simplefinApi.setContext(accountContext);

    fakeHttpClient.setResponse(
      'https://bridge.simplefin.org/simplefin/accounts/?start-date=1672534800&end-date=1675126800&pending=1',
      new Error('Network Error'),
    );

    await expect(
      simplefinApi.fetchAccounts(startDate, endDate),
    ).rejects.toThrow('Network Error');
  });

  it('should handle error when fetching access key', async () => {
    simplefinApi.setContext(accessKeyContext);

    fakeHttpClient.setResponse(
      'https://bridge.simplefin.org/simplefin/claim/demo',
      new Error('Network Error'),
    );

    await expect(simplefinApi.fetchAccessKey()).rejects.toThrow(
      'Network Error',
    );
  });
});
