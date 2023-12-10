import { VENDOR_PATTERNS } from './patterns/vendors.js';
import {
  applyTransactionPatterns as applyTransactionPatterns,
  normalizeCreditorAndDebtorNames,
} from './utils/apply-pattern.js';
import ib from '../banks/integration-bank.js';
import { applyTitleCaseToFields } from './utils/other.js';

/** @type {import('../banks/bank.interface.js').IBank} */
export default {
  institutionIds: ['CAIXA_GERAL_DEPOSITOS_CGDIPTPL'],
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
      VENDOR_PATTERNS,
    );

    return applyTitleCaseToFields(updatedTransaction, [
      'debtorName',
      'creditorName',
      'remittanceInformationUnstructured',
    ]);
  },

  sortTransactions(transactions = []) {
    return ib.sortTransactions(transactions);
  },

  calculateStartingBalance(sortedTransactions = [], balances = []) {
    return ib.calculateStartingBalance(sortedTransactions, balances);
  },
};
