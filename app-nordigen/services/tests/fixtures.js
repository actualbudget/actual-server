const mockedBalances = {
  balances: [
    {
      balanceAmount: {
        amount: '657.49',
        currency: 'string'
      },
      balanceType: 'string',
      referenceDate: '2021-11-22'
    },
    {
      balanceAmount: {
        amount: '185.67',
        currency: 'string'
      },
      balanceType: 'string',
      referenceDate: '2021-11-19'
    }
  ]
};

const mockTransactions = {
  transactions: {
    booked: [
      {
        transactionId: 'string',
        debtorName: 'string',
        debtorAccount: {
          iban: 'string'
        },
        transactionAmount: {
          currency: 'EUR',
          amount: '328.18'
        },
        bankTransactionCode: 'string',
        bookingDate: 'date',
        valueDate: 'date',
        remittanceInformationUnstructured: 'string'
      },
      {
        transactionId: 'string',
        transactionAmount: {
          currency: 'EUR',
          amount: '947.26'
        },
        bankTransactionCode: 'string',
        bookingDate: 'date',
        valueDate: 'date',
        remittanceInformationUnstructured: 'string'
      }
    ],
    pending: [
      {
        transactionAmount: {
          currency: 'EUR',
          amount: '947.26'
        },
        valueDate: 'date',
        remittanceInformationUnstructured: 'string'
      }
    ]
  }
};

const mockUnknownError = {
  summary: "Couldn't update account balances",
  detail: 'Request to Institution returned an error',
  type: 'UnknownRequestError',
  status_code: 500
};

const mockAccountDetails = {
  account: {
    resourceId: 'PL13105010381000009117649849',
    iban: 'PL13105010381000009117649849',
    currency: 'PLN',
    ownerName: 'STYBEL FILIP MICHAŁ',
    product: 'Savings Account for Individuals (Retail)',
    bic: 'INGBPLPW',
    ownerAddressUnstructured: ['MALBORSKA 15/57', '03-286 WARSZAWA']
  }
};

const mockAccountMetaData = {
  id: 'f0e49aa6-f6db-48fc-94ca-4a62372fadf4',
  created: '2022-07-24T20:45:47.847062Z',
  last_accessed: '2023-01-25T22:12:27.814618Z',
  iban: 'PL13105010381000009117649849',
  institution_id: 'ING_PL_INGBPLPW',
  status: 'READY',
  owner_name: 'STYBEL FILIP MICHAŁ'
};

const mockDetailedAccount = {
  ...mockAccountDetails.account,
  ...mockAccountMetaData
};

const mockInstitution = {
  id: 'N26_NTSBDEB1',
  name: 'N26 Bank',
  bic: 'NTSBDEB1',
  transaction_total_days: '90',
  countries: ['GB', 'NO', 'SE'],
  logo: 'https://cdn.nordigen.com/ais/N26_SANDBOX_NTSBDEB1.png'
};

const mockRequisition = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  created: '2023-01-31T18:15:50.172Z',
  redirect: 'string',
  status: 'LN',
  institution_id: 'string',
  agreement: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  reference: 'string',
  accounts: ['f0e49aa6-f6db-48fc-94ca-4a62372fadf4'],
  user_language: 'string',
  link: 'https://ob.nordigen.com/psd2/start/3fa85f64-5717-4562-b3fc-2c963f66afa6/{$INSTITUTION_ID}',
  ssn: 'string',
  account_selection: false,
  redirect_immediate: false
};

const mockDeleteRequisition = {
  summary: 'Requisition deleted',
  detail:
    "Requisition '$REQUISITION_ID' deleted with all its End User Agreements"
};

const mockCreateRequisition = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  created: '2023-02-01T15:53:29.481Z',
  redirect: 'string',
  status: 'CR',
  institution_id: 'string',
  agreement: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  reference: 'string',
  accounts: [],
  user_language: 'string',
  link: 'https://ob.nordigen.com/psd2/start/3fa85f64-5717-4562-b3fc-2c963f66afa6/{$INSTITUTION_ID}',
  ssn: 'string',
  account_selection: false,
  redirect_immediate: false
};

module.exports = {
  mockTransactions,
  mockedBalances,
  mockUnknownError,
  mockAccountMetaData,
  mockAccountDetails,
  mockDetailedAccount,
  mockInstitution,
  mockRequisition,
  mockDeleteRequisition,
  mockCreateRequisition
};
