import { FIELD_PATTERNS } from '../patterns/monzo.js';
import { VENDOR_PATTERNS } from '../patterns/vendors.js';
import {
  applyTransactionPatterns as applyTransactionPatterns,
  applyTransactionMapping,
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

export default {
  institutionIds: ['MONZO_MONZGB2L'],
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
    updatedTransaction = applyTransactionPatterns(
      updatedTransaction,
      VENDOR_PATTERNS,
    );
    updatedTransaction = applyTransactionMapping(
      updatedTransaction,
      TRANSACTION_CODES,
    );

    return updatedTransaction;
  },

  sortTransactions(transactions = []) {
    return ib.default.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.default.calculateStartingBalance(sortedTransactions, balances);
  },
};
