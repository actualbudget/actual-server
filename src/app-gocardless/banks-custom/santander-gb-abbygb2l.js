import { writeFileSync } from 'fs';
import {
  applyTransactionPatterns,
  toTitleCase,
  normalizeCreditorAndDebtorNames,
} from '../custom-banks/utils/apply-pattern.js';
import * as ib from '../banks/integration-bank.js';
import { FIELD_PATTERNS } from './patterns/santander.js';
import { VENDOR_PATTERNS } from './patterns/vendors.js';

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
    updatedTransaction = applyTransactionPatterns(
      updatedTransaction,
      VENDOR_PATTERNS,
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
