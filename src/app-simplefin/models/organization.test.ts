import Organization from './organization.ts';

describe('Organization', () => {
  it('should create an Organization instance from JSON with all fields', () => {
    const json = `{
      "domain": "mybank.com",
      "sfin-url": "https://sfin.mybank.com",
      "name": "My Bank",
      "url": "https://www.mybank.com",
      "id": "12345"
    }`;

    const org = Organization.fromJson(json);
    expect(org).toBeInstanceOf(Organization);
    expect(org.domain).toBe('mybank.com');
    expect(org.sfinUrl).toBe('https://sfin.mybank.com');
    expect(org.name).toBe('My Bank');
    expect(org.url).toBe('https://www.mybank.com');
    expect(org.id).toBe('12345');
  });

  it('should create an Organization instance from JSON with only required fields', () => {
    const json = `{
      "sfin-url": "https://sfin.mybank.com"
    }`;

    const org = Organization.fromJson(json);
    expect(org).toBeInstanceOf(Organization);
    expect(org.sfinUrl).toBe('https://sfin.mybank.com');
    expect(org.domain).toBeUndefined();
    expect(org.name).toBeUndefined();
    expect(org.url).toBeUndefined();
    expect(org.id).toBeUndefined();
  });

  it('should create an Organization instance directly from an object', () => {
    const data = {
      domain: 'mybank.com',
      sfinUrl: 'https://sfin.mybank.com',
      name: 'My Bank',
      url: 'https://www.mybank.com',
      id: '12345',
    };

    const org = new Organization(data);
    expect(org).toBeInstanceOf(Organization);
    expect(org.domain).toBe('mybank.com');
    expect(org.sfinUrl).toBe('https://sfin.mybank.com');
    expect(org.name).toBe('My Bank');
    expect(org.url).toBe('https://www.mybank.com');
    expect(org.id).toBe('12345');
  });
});
