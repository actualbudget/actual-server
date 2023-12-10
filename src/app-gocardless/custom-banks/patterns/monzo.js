export const TRANSACTION_CODES = {
  '3dsecure': 'Online security-authenticated transaction',
  account_interest: 'Account interest credit',
  bacs: 'Regular BACS payment',
  card_delivery: 'Bank card delivery charge',
  chaps: 'High-value same-day transfer',
  collections_settlement: 'Collections or debt settlement',
  emergency_cash: 'Emergency cash withdrawal',
  faster_payments: 'Immediate Faster Payments transfer',
  instalment_loan: 'Instalment loan repayment',
  ledger_adjustment: 'Ledger correction adjustment',
  locked_money: 'Locked funds transaction',
  mastercard: 'Mastercard network transaction',
  monzo_business_account_billing: 'Monzo business account service billing',
  monzo_flex: 'Monzo Flex plan transaction',
  monzo_paid: 'Monzo service payment',
  overdraft: 'Overdraft transaction',
  p2p_payment: 'Peer-to-peer payment',
  payport_faster_payments: 'Payport Faster Payments transaction',
  rbs_cheque: 'RBS cheque transaction',
  sepa: 'SEPA network transaction',
  signup_referral: 'Signup referral transaction',
  spread_the_cost: 'Cost-spreading service transaction',
  topup: 'Account top-up',
  uk_business_pot: 'UK business financial transaction',
  uk_cash_deposits_paypoint: 'UK PayPoint cash deposit',
  // uk_retail_pot: 'UK retail financial transaction',
};

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
        replacement: '[Savings Account]',
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
