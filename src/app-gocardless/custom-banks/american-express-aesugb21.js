import { VENDOR_PATTERNS } from './patterns/vendors.js';
import {
  applyTransactionPatterns,
  normalizeCreditorAndDebtorNames,
} from './utils/apply-pattern.js';
import ib from '../banks/integration-bank.js';
import { applyTitleCaseToFields, categorise } from './utils/other.js';

// Helper function to merge transaction with categorization data
function mergeTransactionWithCategories(transaction, categoriesData) {
  const merchant = categoriesData.merchant;
  const categoriesStr = [
    transaction.remittanceInformationUnstructured,
    '. Categories: ',
    categoriesData.label_group,
    ...categoriesData.labels,
  ].join('');

  return {
    ...transaction,
    remittanceInformationUnstructured: categoriesStr,
    debtorName: merchant || transaction.debtorName,
    creditorName: merchant || transaction.creditorName,
  };
}

export default {
  institutionIds: ['AMERICAN_EXPRESS_AESUGB21'],

  normalizeAccount(account) {
    return ib.normalizeAccount(account);
  },

  normalizeTransaction(transaction, _booked) {
    let updatedTransaction = ib.normalizeTransaction(transaction, _booked);
    if (!updatedTransaction) return null;

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
    let categorizationMap = categorise(transactions);

    return ib.sortTransactions(
      transactions.map((transaction) => {
        const categoryData = categorizationMap.get(transaction.transactionId);
        return categoryData
          ? mergeTransactionWithCategories(transaction, categoryData)
          : transaction;
      }),
    );
  },

  calculateStartingBalance(sortedTransactions, balances) {
    return ib.calculateStartingBalance(sortedTransactions, balances);
  },
};
