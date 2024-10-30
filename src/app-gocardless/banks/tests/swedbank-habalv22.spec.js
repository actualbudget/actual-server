import SwedbankHabaLV22 from '../swedbank-habalv22.js';

describe('#normalizeTransaction', () => {
  const cardTransaction = {
    transactionId: '2024102900000000-1',
    bookingDate: '2024-10-29',
    valueDate: '2024-10-29',
    transactionAmount: {
      amount: '-22.99',
      currency: 'EUR',
    },
    creditorName: 'SOME CREDITOR NAME',
    remittanceInformationUnstructured:
      'PIRKUMS 424242******4242 28.10.2024 22.99 EUR (111111) SOME CREDITOR NAME',
    bankTransactionCode: 'PMNT-CCRD-POSD',
    internalTransactionId: 'fa000f86afb2cc7678bcff0000000000',
  };

  it('extracts card transaction date', () => {
    expect(
      SwedbankHabaLV22.normalizeTransaction(cardTransaction, true).bookingDate,
    ).toEqual('2024-10-28');

    expect(
      SwedbankHabaLV22.normalizeTransaction(cardTransaction, true).date,
    ).toEqual('2024-10-28');
  });

  it('normalizes non-card transactions as usual', () => {
    const nonCardTransaction1 = {
      ...cardTransaction,
      remittanceInformationUnstructured: 'Some info',
    };
    expect(
      SwedbankHabaLV22.normalizeTransaction(nonCardTransaction1, true)
        .bookingDate,
    ).toEqual('2024-10-29');

    expect(
      SwedbankHabaLV22.normalizeTransaction(nonCardTransaction1, true).date,
    ).toEqual('2024-10-29');

    const nonCardTransaction2 = {
      ...cardTransaction,
      remittanceInformationUnstructured: 'PIRKUMS xxx',
    };
    expect(
      SwedbankHabaLV22.normalizeTransaction(nonCardTransaction2, true)
        .bookingDate,
    ).toEqual('2024-10-29');

    expect(
      SwedbankHabaLV22.normalizeTransaction(nonCardTransaction2, true).date,
    ).toEqual('2024-10-29');

    const nonCardTransaction3 = {
      ...cardTransaction,
      remittanceInformationUnstructured: null,
    };
    expect(
      SwedbankHabaLV22.normalizeTransaction(nonCardTransaction3, true)
        .bookingDate,
    ).toEqual('2024-10-29');

    expect(
      SwedbankHabaLV22.normalizeTransaction(nonCardTransaction3, true).date,
    ).toEqual('2024-10-29');
  });
});
