import { writeFileSync } from 'fs';
import {
  applyTransactionPatterns,
  applyTransactionMapping,
  toTitleCase,
  normalizeCreditorAndDebtorNames,
} from '../util/apply-pattern.js';
import * as ib from './integration-bank.js';

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
  // uk_retail_pot: 'UK retail financial transaction',
};

const FIELD_PATTERNS = [
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
        regex: /^BANK GIRO CREDIT REF (.+?)[,]? \d{2}-\d{2}-\d{2}$/i,
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
        regex: /^([A-Za-z0-9\s]+?) FROM ([A-Za-z0-9\s]+?)"$/i,
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
];

export default {
  institutionIds: ['SANTANDER_GB_ABBYGB2L'],
  normalizeAccount(account) {
    return ib.default.normalizeAccount(account);
  },

  normalizeTransaction(transaction, _booked) {
    let updatedTransaction = ib.default.normalizeTransaction(
      transaction,
      _booked,
    );
    if (!updatedTransaction) {
      return null;
    }

    updatedTransaction = normalizeCreditorAndDebtorNames(updatedTransaction);
    updatedTransaction = applyTransactionPatterns(
      updatedTransaction,
      FIELD_PATTERNS,
    );
    updatedTransaction = applyTransactionMapping(
      updatedTransaction,
      TRANSACTION_CODES,
    );

    ['debtorName', 'creditorName', 'remittanceInformationUnstructured'].forEach(
      (fieldName) => {
        let fieldValue = updatedTransaction[fieldName];
        if (fieldValue) {
          updatedTransaction[fieldName] = toTitleCase(fieldValue);
        }
      },
    );

    return updatedTransaction;
  },

  sortTransactions(transactions = []) {
    writeFileSync('/data/santander.json', JSON.stringify(transactions));
    return ib.default.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.default.calculateStartingBalance(sortedTransactions, balances);
  },
};
