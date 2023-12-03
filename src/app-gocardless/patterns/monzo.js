export const FIELD_PATTERNS = [
  {
    transactionCode: 'mastercard',
    patterns: [
      {
        regex: /^(.+?) From (.+?) Pot$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
    ],
  },
  {
    transactionCode: 'account_interest',
    patterns: [
      {
        regex: /^Interest for (\w+ [0-9]{4})$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
    ],
  },
  {
    transactionCode: 'uk_retail_pot',
    patterns: [
      {
        regex: /^(.+)$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: {
          credited: 'debtorName',
          debited: 'creditorName',
        },
        replacement: 'Savings Account',
      },
      {
        regex: /^(.+)$/i,
        targetField: {
          credited: 'remittanceInformationUnstructured',
          debited: 'remittanceInformationUnstructured',
        },
        replacement: 'Savings Account $1',
      },
    ],
  },
  {
    transactionCode: 'p2p_payment',
    patterns: [
      {
        regex: /^(.+)$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
    ],
  },
];
