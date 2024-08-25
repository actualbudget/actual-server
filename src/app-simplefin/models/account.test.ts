import Account from './account.ts';
import Organization from './organization.ts';
import Transaction from './transaction.ts';

describe('Account', () => {
  it('should create an Account instance from JSON with all fields', () => {
    const json = `{
      "org": {
        "domain": "mybank.com",
        "sfin-url": "https://sfin.mybank.com"
      },
      "id": "2930002",
      "name": "Savings",
      "currency": "USD",
      "balance": "100.23",
      "available-balance": "75.23",
      "balance-date": 978366153,
      "transactions": [
        {
          "id": "12394832938403",
          "posted": 793090572,
          "amount": "-33293.43",
          "description": "Uncle Frank's Bait Shop"
        }
      ],
      "extra": {
        "account-open-date": 978360153
      }
    }`;

    const account = Account.fromJson(json);
    const expectedTransaction = new Transaction({
      id: '12394832938403',
      posted: 793090572,
      amount: '-33293.43',
      description: "Uncle Frank's Bait Shop",
    });

    expect(account).toBeInstanceOf(Account);
    expect(account.org).toBeInstanceOf(Organization);
    expect(account.id).toBe('2930002');
    expect(account.name).toBe('Savings');
    expect(account.currency).toBe('USD');
    expect(account.balance).toBe('100.23');
    expect(account.availableBalance).toBe('75.23');
    expect(account.balanceDate).toEqual(new Date(978366153 * 1000));
    expect(account.transactions).toHaveLength(1);
    expect(account.transactions[0]).toBeInstanceOf(Transaction);
    expect(account.transactions[0]).toEqual(expectedTransaction);
    expect(account.extra).toEqual({ accountOpenDate: 978360153 });
  });

  it('should create an Account instance from JSON with only required fields', () => {
    const json = `{
      "org": {
        "domain": "mybank.com",
        "sfin-url": "https://sfin.mybank.com"
      },
      "id": "2930002",
      "name": "Savings",
      "currency": "USD",
      "balance": "100.23",
      "balance-date": 978366153
    }`;

    const account = Account.fromJson(json);
    expect(account).toBeInstanceOf(Account);
    expect(account.org).toBeInstanceOf(Organization);
    expect(account.id).toBe('2930002');
    expect(account.name).toBe('Savings');
    expect(account.currency).toBe('USD');
    expect(account.balance).toBe('100.23');
    expect(account.availableBalance).toBeUndefined();
    expect(account.balanceDate).toEqual(new Date(978366153 * 1000));

    // Make sure transactions are an empty array
    // and that extra is an empty object
    expect(account.transactions).toEqual([]);
    expect(account.extra).toEqual({});
  });

  it('should create an Account instance directly from an object', () => {
    const org = new Organization({
      domain: 'mybank.com',
      sfinUrl: 'https://sfin.mybank.com',
    });

    const transaction = new Transaction({
      id: '12394832938403',
      posted: 793090572,
      amount: '-33293.43',
      description: "Uncle Frank's Bait Shop",
    });

    const data = {
      org: org,
      id: '2930002',
      name: 'Savings',
      currency: 'USD',
      balance: '100.23',
      availableBalance: '75.23',
      balanceDate: 978366153,
      transactions: [transaction],
      extra: {
        accountOpenDate: 978360153,
      },
    };

    const account = new Account(data);
    expect(account).toBeInstanceOf(Account);
    expect(account.org).toBeInstanceOf(Organization);
    expect(account.id).toBe('2930002');
    expect(account.name).toBe('Savings');
    expect(account.currency).toBe('USD');
    expect(account.balance).toBe('100.23');
    expect(account.availableBalance).toBe('75.23');
    expect(account.balanceDate).toEqual(new Date(978366153 * 1000));
    expect(account.transactions).toHaveLength(1);
    expect(account.transactions[0]).toBeInstanceOf(Transaction);
    expect(account.transactions[0]).toEqual(transaction);
    expect(account.extra).toEqual({
      accountOpenDate: 978360153,
    });
  });
});
