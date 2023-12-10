export const VENDOR_PATTERNS = [
  {
    transactionCode: 'any',
    patterns: [
      {
        regex: /^\s+$/gi,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: ' ',
      },
      {
        regex: /^Sq[*\s]{1}(.+?)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Sp[*\s]{1}(.+?)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Lpc\*(.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Amazon\.Co\.Uk\*[a-zA-Z0-9]+$/gi,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Marketplace',
      },
      {
        regex: /^Amz\*Amazon\.Co\.Uk$/gi,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Marketplace',
      },
      {
        regex: /^American Exp [0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'American Express',
      },
      {
        regex: /^Amex Cbr Bacs$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'American Express',
      },
      {
        regex: /^British A[0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'British Airways',
      },
      {
        regex: /^Bolt\.Eu\/O\/[0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Bolt',
      },
      {
        regex: /^Boots [0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Boots',
      },
      {
        regex: /^Soho House ([A-Za-z0-9]+\s{0,1}){2}$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Soho House',
      },
      {
        regex: /^Stichting Degiro\. Ref: .+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Stichting Degiro',
      },
      {
        regex: /^Amazon Prime\*[a-zA-Z0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Prime',
      },
      {
        regex: /^[-]?Fedex[-]?\*[a-zA-Z0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Fedex',
      },
      {
        regex: /^Apple\.Com\/Bill$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Apple Billing',
      },
      {
        regex: /^Lim\*([A-Za-z]+\s{0,1}){1,2}$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Lime',
      },
      {
        regex: /^Ubr\*\s{0,1}Pending\.Uber\.Com$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Uber',
      },
      {
        regex: /^Uber\* Eats (Pending){0,1}$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Uber Eats',
      },
      {
        regex: /^Uber \* Eats Pending{0,1}$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Uber Eats',
      },
      {
        regex: /^Sumup \*(.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Zettle_\*(.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^3cpayment[*\s]{1}(.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Zen\s+London$/i,
        sourceField: 'remittanceInformationUnstructured',
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Zen Healthcare',
      },
      {
        regex: /^Zen$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Zen Healthcare',
      },
      {
        regex: /^Indiegogo\*(.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Refund at Paypal \*(.+)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '$1',
      },
      {
        regex: /^Tap[0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Tap Air Portugal',
      },
      {
        regex: /(?<=Ref:\s)([A-Z0-9]{4}\s){2}/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'XXXX XXXX',
      },
    ],
  },
];
