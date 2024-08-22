import AccountSet from './account-set.ts';
import Account from './account.ts';

describe('AccountResponse', () => {
  it('should create an AccountResponse instance from JSON with all fields', () => {
    const json = `{
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

    const accountResponse = AccountSet.fromJson(json);
    expect(accountResponse).toBeInstanceOf(AccountSet);
    expect(accountResponse.errors).toEqual([]);
    expect(accountResponse.accounts.length).toBe(1);
    expect(accountResponse.accounts[0]).toBeInstanceOf(Account);
    expect(accountResponse.accounts[0].id).toBe("2930002");
    expect(accountResponse.accounts[0].name).toBe("Savings");
    expect(accountResponse.accounts[0].currency).toBe("USD");
    expect(accountResponse.accounts[0].balance).toBe("100.23");
    expect(accountResponse.accounts[0].availableBalance).toBe("75.23");
    expect(accountResponse.accounts[0].balanceDate).toBe(978366153);
    expect(accountResponse.accounts[0].transactions).toEqual([
      {
        id: "12394832938403",
        posted: 793090572,
        amount: "-33293.43",
        description: "Uncle Frank's Bait Shop"
      }
    ]);
    expect(accountResponse.accounts[0].extra).toEqual({
      accountOpenDate: 978360153
    });
  });

  it('should create an AccountResponse instance from JSON with only required fields', () => {
    const json = `{
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
          "balanceDate": 978366153
        }
      ]
    }`;

    const accountResponse = AccountSet.fromJson(json);
    expect(accountResponse).toBeInstanceOf(AccountSet);
    expect(accountResponse.errors).toEqual([]);
    expect(accountResponse.accounts.length).toBe(1);
    expect(accountResponse.accounts[0]).toBeInstanceOf(Account);
    expect(accountResponse.accounts[0].id).toBe("2930002");
    expect(accountResponse.accounts[0].name).toBe("Savings");
    expect(accountResponse.accounts[0].currency).toBe("USD");
    expect(accountResponse.accounts[0].balance).toBe("100.23");
    expect(accountResponse.accounts[0].availableBalance).toBeUndefined();
    expect(accountResponse.accounts[0].balanceDate).toBe(978366153);
    expect(accountResponse.accounts[0].transactions).toBeUndefined();
    expect(accountResponse.accounts[0].extra).toBeUndefined();
  });

  it('should create an AccountResponse instance from JSON with an empty accounts array', () => {
    const json = `{
      "errors": [],
      "accounts": []
    }`;

    const accountResponse = AccountSet.fromJson(json);
    expect(accountResponse).toBeInstanceOf(AccountSet);
    expect(accountResponse.errors).toEqual([]);
    expect(accountResponse.accounts).toEqual([]);
  });

  it('should create an AccountResponse instance from JSON with an empty errors array', () => {
    const json = `{
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
          "balanceDate": 978366153
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