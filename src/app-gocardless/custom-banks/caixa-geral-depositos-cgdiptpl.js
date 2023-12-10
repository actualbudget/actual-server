import { writeFileSync } from 'fs';
import { VENDOR_PATTERNS } from './patterns/vendors.js';
import {
  applyTransactionPatterns as applyTransactionPatterns,
  normalizeCreditorAndDebtorNames,
} from './utils/apply-pattern.js';
import * as ib from '../banks/integration-bank.js';
import { applyTitleCaseToFields } from './utils/other.js';

export default {
  institutionIds: ['CAIXA_GERAL_DEPOSITOS_CGDIPTPL'],
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

    return applyTitleCaseToFields(updatedTransaction, [
      'debtorName',
      'creditorName',
      'remittanceInformationUnstructured',
    ]);
  },

  sortTransactions(transactions = []) {
    writeFileSync('/data/transactions.json', JSON.stringify(transactions));
    return ib.default.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.default.calculateStartingBalance(sortedTransactions, balances);
  },
};
