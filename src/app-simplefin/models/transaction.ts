class Transaction {
  // Source: https://www.simplefin.org/protocol.html#transaction
  id: string;
  posted: Date;
  amount: string;
  description: string;
  transacted_at?: Date;
  pending: boolean;
  extra?: object;

  constructor(data: {
    id: string;
    posted: number;
    amount: string;
    description: string;
    transacted_at?: number;
    pending?: boolean;
    extra?: object;
  }) {
    this.id = data.id;

    // If the transaction is pending, this can be 0
    this.posted = new Date(data.posted * 1000);

    // Positive numbers indicate money being deposited into the account
    this.amount = data.amount;
    this.description = data.description;

    this.transacted_at = data.transacted_at
      ? new Date(data.transacted_at * 1000)
      : undefined;
    this.pending = data.pending ?? false;
    this.extra = data.extra;
  }

  static fromJson(json: string): Transaction {
    const data = JSON.parse(json);
    return new Transaction(data);
  }
}

export default Transaction;
