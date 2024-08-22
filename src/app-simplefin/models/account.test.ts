import Account from './account.ts';
import Organization from './organization.ts';

describe('Account', () => {
  it('should create an Account instance from JSON with all fields', () => {
    const json = `{
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
    }`;

    const account = Account.fromJson(json);
    expect(account).toBeInstanceOf(Account);
    expect(account.org).toBeInstanceOf(Organization);
    expect(account.id).toBe("2930002");
    expect(account.name).toBe("Savings");
    expect(account.currency).toBe("USD");
    expect(account.balance).toBe("100.23");
    expect(account.availableBalance).toBe("75.23");
    expect(account.balanceDate).toBe(978366153);
    expect(account.transactions).toEqual([
      {
        id: "12394832938403",
        posted: 793090572,
        amount: "-33293.43",
        description: "Uncle Frank's Bait Shop"
      }
    ]);
    expect(account.extra).toEqual({
      accountOpenDate: 978360153
    });
  });

  it('should create an Account instance from JSON with only required fields', () => {
    const json = `{
      "org": {
        "domain": "mybank.com",
        "sfinUrl": "https://sfin.mybank.com"
      },
      "id": "2930002",
      "name": "Savings",
      "currency": "USD",
      "balance": "100.23",
      "balanceDate": 978366153
    }`;

    const account = Account.fromJson(json);
    expect(account).toBeInstanceOf(Account);
    expect(account.org).toBeInstanceOf(Organization);
    expect(account.id).toBe("2930002");
    expect(account.name).toBe("Savings");
    expect(account.currency).toBe("USD");
    expect(account.balance).toBe("100.23");
    expect(account.availableBalance).toBeUndefined();
    expect(account.balanceDate).toBe(978366153);
    expect(account.transactions).toBeUndefined();
    expect(account.extra).toBeUndefined();
  });

  it('should create an Account instance directly from an object', () => {
    const org = new Organization({
      domain: "mybank.com",
      sfinUrl: "https://sfin.mybank.com"
    });

    const data = {
      org: org,
      id: "2930002",
      name: "Savings",
      currency: "USD",
      balance: "100.23",
      availableBalance: "75.23",
      balanceDate: 978366153,
      transactions: [
        {
          id: "12394832938403",
          posted: 793090572,
          amount: "-33293.43",
          description: "Uncle Frank's Bait Shop"
        }
      ],
      extra: {
        accountOpenDate: 978360153
      }
    };

    const account = new Account(data);
    expect(account).toBeInstanceOf(Account);
    expect(account.org).toBeInstanceOf(Organization);
    expect(account.id).toBe("2930002");
    expect(account.name).toBe("Savings");
    expect(account.currency).toBe("USD");
    expect(account.balance).toBe("100.23");
    expect(account.availableBalance).toBe("75.23");
    expect(account.balanceDate).toBe(978366153);
    expect(account.transactions).toEqual([
      {
        id: "12394832938403",
        posted: 793090572,
        amount: "-33293.43",
        description: "Uncle Frank's Bait Shop"
      }
    ]);
    expect(account.extra).toEqual({
      accountOpenDate: 978360153
    });
  });
});