import { FIELD_PATTERNS, TRANSACTION_CODES } from './patterns/monzo.js';
import { VENDOR_PATTERNS } from './patterns/vendors.js';
import {
  applyTransactionPatterns as applyTransactionPatterns,
  applyTransactionMapping,
  normalizeCreditorAndDebtorNames,
} from './utils/apply-pattern.js';
import ib from '../banks/integration-bank.js';
import { applyTitleCaseToFields } from './utils/other.js';
import { writeFileSync } from 'fs';

/** @type {import('../banks/bank.interface.js').IBank} */
export default {
  institutionIds: ['MONZO_MONZGB2L'],
  normalizeAccount(account) {
    return ib.normalizeAccount(account);
  },

  normalizeTransaction(transaction, _booked) {
    let updatedTransaction = ib.normalizeTransaction(transaction, _booked);
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

    return applyTitleCaseToFields(updatedTransaction, [
      'debtorName',
      'creditorName',
      'remittanceInformationUnstructured',
    ]);
  },

  sortTransactions(transactions = []) {
    writeFileSync(
      '/data/transactions-monzo.json',
      JSON.stringify(transactions),
    );
    return ib.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.calculateStartingBalance(sortedTransactions, balances);
  },
};
