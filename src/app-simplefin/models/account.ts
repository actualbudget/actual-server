import Organization from './organization.ts';
import Transaction from './transaction.ts';

class Account {
  org: Organization;
  id: string;
  name: string;
  currency: string;
  balance: string;
  availableBalance?: string;
  balanceDate: number;
  transactions?: Array<Transaction>;
  extra?: object;

  constructor(data: {
    org: Organization;
    id: string;
    name: string;
    currency: string;
    balance: string;
    availableBalance?: string;
    balanceDate: number;
    transactions?: Array<Transaction>;
    extra?: object;
  }) {
    this.org = data.org;
    this.id = data.id;
    this.name = data.name;
    this.currency = data.currency;
    this.balance = data.balance;
    this.availableBalance = data.availableBalance;
    this.balanceDate = data.balanceDate;
    this.transactions = data.transactions;
    this.extra = data.extra;
  }

  static fromJson(json: string): Account {
    const data = JSON.parse(json);
    data.org = Organization.fromJson(JSON.stringify(data.org));
    data.transactions = data.transactions.map((transaction: any) => 
      Transaction.fromJson(JSON.stringify(transaction))
    );
    return new Account(data);
  }
}

export default Account;
