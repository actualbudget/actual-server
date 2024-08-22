import Transaction from './transaction.ts';

describe('Transaction', () => {
  it('should create a Transaction instance from JSON', () => {
    const json = `{
      "id": "12394832938403",
      "posted": 793090572,
      "amount": "-33293.43",
      "description": "Uncle Frank's Bait Shop",
      "pending": true,
      "extra": {
        "category": "food"
      }
    }`;

    const expectedPosted = 793090572 * 1000;
    const transactionFromJson = Transaction.fromJson(json);
    expect(transactionFromJson).toBeInstanceOf(Transaction);
    expect(transactionFromJson.id).toBe('12394832938403');
    expect(transactionFromJson.posted.getTime()).toBe(expectedPosted);
    expect(transactionFromJson.amount).toBe('-33293.43');
    expect(transactionFromJson.description).toBe("Uncle Frank's Bait Shop");
    expect(transactionFromJson.pending).toBe(true);
    // expect(transactionFromJson.extra.category).toBe("food");
  });

  it('should create a Transaction instance from an object', () => {
    const transactionData = {
      id: '12394832938403',
      posted: 793090572,
      amount: '-33293.43',
      description: "Uncle Frank's Bait Shop",
      pending: true,
      extra: {
        category: 'food',
      },
    };

    const expectedPosted = 793090572 * 1000;
    const transactionFromObject = new Transaction(transactionData);
    expect(transactionFromObject).toBeInstanceOf(Transaction);
    expect(transactionFromObject.id).toBe('12394832938403');
    expect(transactionFromObject.posted.getTime()).toBe(expectedPosted);
    expect(transactionFromObject.amount).toBe('-33293.43');
    expect(transactionFromObject.description).toBe("Uncle Frank's Bait Shop");
    expect(transactionFromObject.pending).toBe(true);
    // expect(transactionFromObject.extra.category).toBe("food");
  });
});
