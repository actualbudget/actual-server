import { MASTERCARD_CODES } from '../patterns/mastercard.js';
import { FIELD_PATTERNS, TRANSACTION_CODES } from '../patterns/monzo.js';
import { VENDOR_PATTERNS } from '../patterns/vendors.js';
import {
  applyTransactionPatterns as applyTransactionPatterns,
  applyTransactionMapping,
  normalizeCreditorAndDebtorNames,
  toTitleCase,
} from '../util/apply-pattern.js';
import * as ib from './integration-bank.js';

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

    const {
      merchantCategoryCode,
      proprietaryBankTransactionCode,
      remittanceInformationUnstructured,
    } = updatedTransaction || {};

    if (
      merchantCategoryCode &&
      proprietaryBankTransactionCode === 'mastercard'
    ) {
      const merchanCategory = MASTERCARD_CODES[merchantCategoryCode];
      if (merchanCategory) {
        updatedTransaction[
          'remittanceInformationUnstructured'
        ] = `${remittanceInformationUnstructured} Of ${merchanCategory}`;
      }
    }

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
    return ib.default.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.default.calculateStartingBalance(sortedTransactions, balances);
  },
};
