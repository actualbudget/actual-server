export const FIELD_PATTERNS = [
  {
    transactionCode: 'any',
    patterns: [
      {
        regex: /^\s+$/gi,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: ' ',
      },
    ],
  },
  {
    transactionCode: 'OTT DEBIT',
    patterns: [
      {
        regex: /^(?:SQ [*]{0,1}){1,1}([A-Za-z0-9\s]+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^FOREIGN CURRENCY CONVERSION FEE$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Santander',
      },
      {
        regex: /^([A-Za-z0-9\s]+) [0-9]{2,2}[A-Z]{3,3} [A-Z0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
    ],
  },
  {
    transactionCode: 'BANK TRANSFER CREDIT',
    patterns: [
      {
        regex: /^BANK GIRO CREDIT REF (.+?), (.+)$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
    ],
  },
  {
    transactionCode: 'BANK TRANSFER DEBIT',
    patterns: [
      {
        regex:
          /^(.+?) REFERENCE ([A-Za-z0-9\s]+){1,1}(-[A-Za-z0-9]+){0,1} [A-Za-z0-9\s]+?$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^(.+?) REFERENCE ([A-Za-z0-9\s]+){1,1} [A-Za-z0-9\s]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^(.+?) REFERENCE (.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
    ],
  },
  {
    transactionCode: 'FASTER PAYMENT RECEIPT',
    patterns: [
      {
        regex: /^([A-Za-z0-9\s]+?) FROM ([A-Za-z0-9\s]+?)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$2',
      },
    ],
  },
  {
    transactionCode: 'DEBIT CARD CASH WITHDRAWAL',
    patterns: [
      {
        regex:
          /^CASH WITHDRAWAL HANDLING CHARGE \(% \d+\.\d{2}: MAX (\d{1,3})(,\d{1,3}){1,2}(\.\d{2,2}){1}$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Santander',
      },
      {
        regex:
          /^CASH WITHDRAWAL AT ATM ([A-Za-z\s]+), ([A-Za-z\s]+),? (\d{1,3}(,?\d{3})*\.\d{2}) [A-Z]{3},? RATE \d+\.\d{4} [A-Z]{3} ON (\d{2}-\d{2}-\d{4})$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Santander',
      },
    ],
  },
  {
    transactionCode: 'CREDIT INTEREST',
    patterns: [
      {
        regex: /^INTEREST PAID AFTER TAX (\d{1,3}(,?\d{3})*\.\d{2}) DEDUCTED$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Santander',
      },
    ],
  },
  {
    transactionCode: 'MONTHLY ACCOUNT FEE',
    patterns: [
      {
        regex: /^.+$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Santander',
      },
    ],
  },
  {
    transactionCode: 'APPLE PAY IN-APP',
    patterns: [
      {
        regex: /^.+$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Apple Pay',
      },
    ],
  },
  {
    transactionCode: 'CASHBACK',
    patterns: [
      {
        regex: /^.+Direct Debit Payment.+$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Santander',
      },
    ],
  },
];
