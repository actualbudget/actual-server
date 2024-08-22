import Account from './account.ts';

class AccountSet {
  // https://www.simplefin.org/protocol.html#account-set
  errors: Array<any>;
  accounts: Array<Account>;

  constructor(data: { errors: Array<any>; accounts: Array<Account> }) {
    this.errors = data.errors;
    this.accounts = data.accounts;
  }

  static fromJson(json: string): AccountSet {
    const data = JSON.parse(json);
    data.accounts = data.accounts.map((account: any) =>
      Account.fromJson(JSON.stringify(account)),
    );
    return new AccountSet(data);
  }
}

export default AccountSet;
