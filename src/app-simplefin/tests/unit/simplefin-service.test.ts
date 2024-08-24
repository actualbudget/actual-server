// fake-simplefin-api.ts
import {
  SimpleFinApiInterface,
  SimplefinContextData,
} from '../../services/simplefin-api.ts';
import AccountSet from '../../models/account-set.ts';
import { SimpleFinService } from '../../services/simplefin-service.ts';

const ACCESS_KEY = 'https://demo:demo@bridge.simplefin.org/simplefin';

class FakeSimplefinAPI implements SimpleFinApiInterface {
  private context: SimplefinContextData;

  setContext(context: SimplefinContextData): void {
    this.context = context;
  }

  async fetchAccessKey(): Promise<void> {
    this.context.accessKey = ACCESS_KEY;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchAccounts(startDate: Date, endDate: Date): Promise<AccountSet> {
    const accounts = AccountSet.fromJson(
      `{
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
    }`,
    );
    return Promise.resolve(accounts);
  }
}

describe('SimpleFinService', () => {
  let service: SimpleFinService;

  beforeEach(() => {
    service = new SimpleFinService(new FakeSimplefinAPI());
  });

  it('should retrieve the access key', async () => {
    const accessKey = await service.getAccessKey('base64Token');
    expect(accessKey).toBe(ACCESS_KEY);
  });

  it('should retrieve accounts', async () => {
    const accounts = await service.getAccounts(
      ACCESS_KEY,
      new Date(),
      new Date(),
    );
    expect(accounts).toBeInstanceOf(AccountSet);
    expect(accounts.accounts.length).toBe(1);
    expect(accounts.accounts[0].name).toBe('Savings');
  });

  it('should retrieve transactions within a date range', async () => {
    const startDate = new Date(2023, 0, 1);
    const endDate = new Date(2023, 0, 31);
    const accounts = await service.getTransactions(
      ACCESS_KEY,
      startDate,
      endDate,
    );
    expect(accounts).toBeInstanceOf(AccountSet);
    expect(accounts.accounts.length).toBe(1);
    expect(accounts.accounts[0].transactions[0].description).toBe(
      "Uncle Frank's Bait Shop",
    );
  });
});
