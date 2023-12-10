import { writeFileSync } from 'fs';
import {
  applyTransactionPatterns,
  normalizeCreditorAndDebtorNames,
} from './utils/apply-pattern.js';
import ib from '../banks/integration-bank.js';
import { FIELD_PATTERNS } from './patterns/santander.js';
import { VENDOR_PATTERNS } from './patterns/vendors.js';
import { applyTitleCaseToFields } from './utils/other.js';

/** @type {import('../banks/bank.interface.js').IBank} */
export default {
  institutionIds: ['SANTANDER_GB_ABBYGB2L'],
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

    return applyTitleCaseToFields(updatedTransaction, [
      'debtorName',
      'creditorName',
      'remittanceInformationUnstructured',
    ]);
  },

  sortTransactions(transactions = []) {
    writeFileSync('/data/santander.json', JSON.stringify(transactions));
    return ib.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.calculateStartingBalance(sortedTransactions, balances);
  },
};
