import SskDusseldorfDussdeddxxx from '../ssk_dusseldorf_dussdeddxxx.js';

describe('#normalizeTransaction', () => {
  const bookedTransactionOne = {
    transactionId: '2024102900000000-1',
    bookingDate: '2024-10-29',
    valueDate: '2024-10-29',
    transactionAmount: {
      amount: '-99.99',
      currency: 'EUR',
    },
    creditorName: 'a useful creditor name',
    remittanceInformationStructured: 'structured information',
    remittanceInformationUnstructured: 'unstructured information',
    additionalInformation: 'some aditional information',
  };

  const bookedTransactionTwo = {
    transactionId: '2024102900000000-2',
    bookingDate: '2024-10-29',
    valueDate: '2024-10-29',
    transactionAmount: {
      amount: '-99.99',
      currency: 'EUR',
    },
    creditorName: 'a useful creditor name',
    ultimateCreditor: 'ultimate creditor',
    remittanceInformationStructured: 'structured information',
    additionalInformation: 'some aditional information',
  };

  it('properly combines remittance information', () => {
    expect(
      SskDusseldorfDussdeddxxx.normalizeTransaction(bookedTransactionOne, true)
        .remittanceInformationUnstructured,
    ).toEqual('unstructured information some aditional information');

    expect(
      SskDusseldorfDussdeddxxx.normalizeTransaction(bookedTransactionTwo, true)
        .remittanceInformationUnstructured,
    ).toEqual('structured information some aditional information');
  });

  it('prioritizes creditor names correctly', () => {
    expect(
      SskDusseldorfDussdeddxxx.normalizeTransaction(bookedTransactionOne, true)
        .payeeName,
    ).toEqual('A Useful Creditor Name');

    expect(
      SskDusseldorfDussdeddxxx.normalizeTransaction(bookedTransactionTwo, true)
        .payeeName,
    ).toEqual('Ultimate Creditor');
  });

  const unbookedTransaction = {
    transactionId: '2024102900000000-1',
    valueDate: '2024-10-29',
    transactionAmount: {
      amount: '-99.99',
      currency: 'EUR',
    },
    creditorName: 'some nonsensical creditor',
    remittanceInformationUnstructured: 'some nonsensical information',
  };

  it('returns null for unbooked transactions', () => {
    expect(
      SskDusseldorfDussdeddxxx.normalizeTransaction(unbookedTransaction, false),
    ).toBeNull;
  });
});
