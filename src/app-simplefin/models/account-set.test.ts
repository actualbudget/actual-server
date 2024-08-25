import AccountSet from './account-set.ts';
import Account from './account.ts';
import Transaction from './transaction.ts';

describe('AccountSet', () => {
  it('should create an AccountSet instance from JSON with all fields', () => {
    const json = `{
      "errors": [],
      "accounts": [
        {
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
        }
      ]
    }`;

    const accountSet = AccountSet.fromJson(json);

    const expectedTransaction = new Transaction({
      id: '12394832938403',
      posted: 793090572,
      amount: '-33293.43',
      description: "Uncle Frank's Bait Shop",
    });

    expect(accountSet).toBeInstanceOf(AccountSet);
    expect(accountSet.errors).toEqual([]);
    expect(accountSet.accounts.length).toBe(1);
    expect(accountSet.accounts[0]).toBeInstanceOf(Account);
    expect(accountSet.accounts[0].id).toBe('2930002');
    expect(accountSet.accounts[0].name).toBe('Savings');
    expect(accountSet.accounts[0].currency).toBe('USD');
    expect(accountSet.accounts[0].balance).toBe('100.23');
    expect(accountSet.accounts[0].availableBalance).toBe('75.23');
    expect(accountSet.accounts[0].balanceDate).toEqual(new Date(978366153 * 1000));
    expect(accountSet.accounts[0].transactions).toEqual([
      expectedTransaction,
    ]);
    expect(accountSet.accounts[0].extra).toEqual({
      accountOpenDate: 978360153,
    });
  });

  it('should create an AccountSet instance from JSON with only required fields', () => {
    const json = `{
      "errors": [],
      "accounts": [
        {
          "org": {
            "domain": "mybank.com",
            "sfin-url": "https://sfin.mybank.com"
          },
          "id": "2930002",
          "name": "Savings",
          "currency": "USD",
          "balance": "100.23",
          "balance-date": 978366153
        }
      ]
    }`;

    const accountSet = AccountSet.fromJson(json);
    expect(accountSet).toBeInstanceOf(AccountSet);
    expect(accountSet.errors).toEqual([]);
    expect(accountSet.accounts.length).toBe(1);
    expect(accountSet.accounts[0]).toBeInstanceOf(Account);
    expect(accountSet.accounts[0].id).toBe('2930002');
    expect(accountSet.accounts[0].name).toBe('Savings');
    expect(accountSet.accounts[0].currency).toBe('USD');
    expect(accountSet.accounts[0].balance).toBe('100.23');
    expect(accountSet.accounts[0].availableBalance).toBeUndefined();
    expect(accountSet.accounts[0].balanceDate).toEqual(new Date(978366153 * 1000));
    expect(accountSet.accounts[0].transactions).toEqual([]);
    expect(accountSet.accounts[0].extra).toEqual({});
  });

  it('should create an AccountSet instance from JSON with an empty accounts array', () => {
    const json = `{
      "errors": [],
      "accounts": []
    }`;

    const accountResponse = AccountSet.fromJson(json);
    expect(accountResponse).toBeInstanceOf(AccountSet);
    expect(accountResponse.errors).toEqual([]);
    expect(accountResponse.accounts).toEqual([]);
  });

  it('should create an AccountSet instance from JSON with an empty errors array', () => {
    const json = `{
      "errors": [],
      "accounts": [
        {
          "org": {
            "domain": "mybank.com",
            "sfin-url": "https://sfin.mybank.com"
          },
          "id": "2930002",
          "name": "Savings",
          "currency": "USD",
          "balance": "100.23",
          "balance-date": 978366153
        }
      ]
    }`;

    const accountResponse = AccountSet.fromJson(json);
    expect(accountResponse).toBeInstanceOf(AccountSet);
    expect(accountResponse.errors).toEqual([]);
    expect(accountResponse.accounts.length).toBe(1);
    expect(accountResponse.accounts[0]).toBeInstanceOf(Account);
  });
});
