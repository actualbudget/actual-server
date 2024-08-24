import Organization from './organization.ts';
import Transaction from './transaction.ts';
import { transformKeys } from '../../util/camelCase.ts';
class Account {
  // https://www.simplefin.org/protocol.html#account
  org: Organization;
  id: string;
  name: string;
  currency: string;
  balance: string;
  availableBalance?: string;
  balanceDate: number;
  // The transactions are ordered by posted
  transactions: Array<Transaction>;
  extra: object;

  constructor(data: {
    org: Organization;
    id: string;
    name: string;
    currency: string;
    balance: string;
    availableBalance?: string;
    balanceDate: number;
    transactions: Array<Transaction>;
    extra: object;
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

    if (data.transactions) {
      data.transactions = data.transactions.map((transaction: object) =>
        Transaction.fromJson(JSON.stringify(transaction)),
      );
    } else {
      // Make sure that the transactions property is always defined
      data.transactions = [];
    }

    const camelCaseData = {
      ...data,
      availableBalance: data['available-balance'],
      balanceDate: data['balance-date'],
      // Make sure that top-level keys are camelCase, not kebab-case
      // and that extra is an object, even if it's not present
      extra: data.extra ? transformKeys(data.extra) : {},
    };

    return new Account(camelCaseData);
  }
}

export default Account;
