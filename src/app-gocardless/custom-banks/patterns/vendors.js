export const VENDOR_PATTERNS = [
  {
    transactionCode: 'any',
    patterns: [
      {
        regex: /^\s\s+$/g,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /([ ]?-[ ]?|[_])/g,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /\s(US|UK|GB)$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /[.](com|co|eu).*$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /\s[(][A-Z]{3,30}[)]$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^(sq|sp|lpc)[*\s]{1}/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^Sumup[ ]?[*]/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^Zettle_[*]/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^3cpayment[*\s]/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^Indiegogo[*]/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^Refund at Paypal[ ]?[*]/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /^Amazon[*][A-Z0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Marketplace',
      },
      {
        regex: /^Amz[*]Amazon$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Marketplace',
      },
      {
        regex: /^Amazon Marketplace.*$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Marketplace',
      },
      {
        regex: /^Amazon [A-Z]{2,3} [A-Z]{2} Retail*$/i,
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
        regex: /^Bolt[.]Eu[/]O[/][0-9]+$/i,
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
        regex: /^Stichting Degiro[.] Ref: .+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Stichting Degiro',
      },
      {
        regex: /^Amazon Prime[*][A-Z0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Amazon Prime',
      },
      {
        regex: /^[-]?Fedex[-]?[*][a-zA-Z0-9]+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Fedex',
      },
      {
        regex: /^Apple[.]Com[/]Bill$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Apple Billing',
      },
      {
        regex: /^Lim[*]([A-Za-z]+\s{0,1}){1,2}$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Lime',
      },
      {
        regex: /^Ubr[*]\s{0,1}Pending\.Uber$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Uber',
      },
      {
        regex: /^Uber[ ]?[*] Eats (Pending){0,1}$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Uber Eats',
      },
      {
        regex: /^Zen(\sLondon)?$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Zen Healthcare',
      },
      {
        regex: /^Spotify Music.+$/i,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: 'Spotify',
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
      {
        regex: /^\s\s+$/g,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
      {
        regex: /([ ]?-[ ]?|[_])/g,
        targetField: { credited: 'debtorName', debited: 'creditorName' },
        replacement: '',
      },
    ],
  },
];
