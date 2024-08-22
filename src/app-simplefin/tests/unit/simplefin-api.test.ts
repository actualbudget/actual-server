import { GenericSimplefinError } from '../../errors.ts';
import { SimplefinContextData } from '../../services/simplefin-api.ts';

describe('SimplefinContextData', () => {

  const simplefinBase64Token = 'aHR0cHM6Ly9icmlkZ2Uuc2ltcGxlZmluLm9yZy9zaW1wbGVmaW4vY2xhaW0vZGVtbw=='

  it('should initialize with correct values', () => {
    const context = new SimplefinContextData('GET', 8080, { 'Content-Type': 'application/json' }, simplefinBase64Token);
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
    expect(context.headers['Authorization']).toBe('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
  });

  it('should build account query string correctly', () => {
    const context = new SimplefinContextData('GET', 8080);
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    context.buildAccountQueryString(startDate, endDate);
    expect(context.queryString).toBe('?start-date=1672534800&end-date=1675126800&pending=1');
  });

  it('should throw error if query string is undefined in accountsUrl', () => {
    const context = new SimplefinContextData('GET', 8080);
    expect(() => context.accountsUrl()).toThrow(GenericSimplefinError);
  });

  it('should throw error if base url is undefined in accountsUrl', () => {
    const context = new SimplefinContextData('GET', 8080);
    context.queryString = '?start-date=1672531200&end-date=1675123200&pending=1';
    expect(() => context.accountsUrl()).toThrow(GenericSimplefinError);
  });

  it('should return correct accounts URL', () => {
    const context = new SimplefinContextData('GET', 8080);
    context.queryString = '?start-date=1672531200&end-date=1675123200&pending=1';
    context.baseUrl = 'http://mybank.com';
    expect(context.accountsUrl()).toBe('http://mybank.com/accounts/?start-date=1672531200&end-date=1675123200&pending=1');
  });

  it('should throw error if base64Token is undefined in accessKeyUrl', () => {
    const context = new SimplefinContextData('GET', 8080);
    expect(() => context.accessKeyUrl()).toThrow(GenericSimplefinError);
  });

  it('should return correct access key URL', () => {
    const context = new SimplefinContextData('GET', 8080, {}, simplefinBase64Token);
    expect(context.accessKeyUrl()).toBe('https://bridge.simplefin.org/simplefin/claim/demo');
  });

  it('should normalize date correctly', () => {
    const context = new SimplefinContextData('GET', 8080);
    const date = new Date('2023-01-01T00:00:00Z');
    expect(context.normalizeDate(date)).toBe(1672534800);
  });
});