import { writeFileSync } from 'fs';
import { VENDOR_PATTERNS } from '../patterns/vendors.js';
import {
  applyTransactionPatterns as applyTransactionPatterns,
  normalizeCreditorAndDebtorNames,
  toTitleCase,
} from '../util/apply-pattern.js';
import * as ib from './integration-bank.js';

export default {
  institutionIds: ['AMERICAN_EXPRESS_AESUGB21'],
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
    writeFileSync('/data/transactions.json', JSON.stringify(transactions));
    return ib.default.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.default.calculateStartingBalance(sortedTransactions, balances);
  },
};
