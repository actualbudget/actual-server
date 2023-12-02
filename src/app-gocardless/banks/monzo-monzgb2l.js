import * as d from 'date-fns';
import {
  sortByBookingDateOrValueDate,
  amountToInteger,
  printIban,
} from '../utils.js';
import { applyPatterns } from '../util/apply-pattern.js';
import { writeFileSync } from 'fs';

const TRANSACTION_CODES = {
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
  uk_retail_pot: 'UK retail financial transaction',
};

const FIELD_PATTERNS = [
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
        replacement: 'Savings Pot ($1)',
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

const SORTED_BALANCE_TYPE_LIST = [
  'closingBooked',
  'expected',
  'forwardAvailable',
  'interimAvailable',
  'interimBooked',
  'nonInvoiced',
  'openingBooked',
];

const getTransactionDate = (transaction) =>
  transaction.bookingDate ||
  transaction.bookingDateTime ||
  transaction.valueDate ||
  transaction.valueDateTime;

const applyTransactionMapping = (transaction, descriptions) => {
  const description = descriptions[transaction.proprietaryBankTransactionCode];
  return description
    ? { ...transaction, remittanceInformationUnstructured: description }
    : transaction;
};

export default {
  institutionIds: ['MONZO_MONZGB2L'],
  normalizeAccount(account) {
    return {
      account_id: account.id,
      institution: account.institution,
      mask: (account?.iban || '0000').slice(-4),
      iban: account?.iban || null,
      name: [account.name, printIban(account), account.currency]
        .filter(Boolean)
        .join(' '),
      official_name: `integration-${account.institution_id}`,
      type: 'checking',
    };
  },

  normalizeTransaction(transaction, _booked) {
    const date = getTransactionDate(transaction);
    if (!date) {
      return null;
    }

    let updatedTransaction = { ...transaction };
    updatedTransaction = applyPatterns(updatedTransaction, FIELD_PATTERNS);
    updatedTransaction = applyTransactionMapping(
      updatedTransaction,
      TRANSACTION_CODES,
    );

    return {
      ...updatedTransaction,
      date: d.format(d.parseISO(date), 'yyyy-MM-dd'),
    };
  },

  sortTransactions(transactions = []) {
    console.log(
      'Available (first 10) transactions properties for new integration of institution in sortTransactions function',
      { top10Transactions: JSON.stringify(transactions.slice(0, 10)) },
    );
    writeFileSync(
      '/data/transactionsSorted.json',
      JSON.stringify(transactions),
    );
    return sortByBookingDateOrValueDate(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    const currentBalance = balances
      .filter((item) => SORTED_BALANCE_TYPE_LIST.includes(item.balanceType))
      .sort(
        (a, b) =>
          SORTED_BALANCE_TYPE_LIST.indexOf(a.balanceType) -
          SORTED_BALANCE_TYPE_LIST.indexOf(b.balanceType),
      )[0];

    return sortedTransactions.reduce(
      (total, trans) => total - amountToInteger(trans.transactionAmount.amount),
      amountToInteger(currentBalance?.balanceAmount?.amount || 0),
    );
  },
};
