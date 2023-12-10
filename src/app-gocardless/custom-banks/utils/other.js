import { isCreditedTransaction } from './apply-pattern.js';
import request from 'sync-request';

export function categorise(transactions) {
  const data = transactions.map((transaction) => ({
    description: `${
      transaction.debtorName || transaction.creditorName
    }; More details: ${transaction.remittanceInformationUnstructured}`,
    entry_type: isCreditedTransaction(transaction) ? 'credit' : 'debit',
    amount: Math.abs(transaction.transactionAmount.amount),
    iso_currency_code: transaction.transactionAmount.currency,
    date: transaction.date,
    country: 'GB',
    transaction_id: transaction.transactionId,
  }));

  try {
    let response = request(
      'POST',
      'https://api.ntropy.com/v2/transactions/sync',
      {
        json: data,
        headers: {
          'X-API-KEY': '0QtjNbwzm2LIrpTGwcMZDkf62b4qjlqdmnAoTXBr',
        },
      },
    );

    let responseBody = JSON.parse(response.getBody('utf8'));
    return new Map(
      responseBody.data?.map((category) => [category.transaction_id, category]),
    );
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}

export function mergeTransactionWithCategories(transaction, categoriesData) {
  const { merchant, label_group: labelGroup, labels } = categoriesData;
  const categoriesStr = [
    transaction.remittanceInformationUnstructured,
    labelGroup,
    ...labels,
  ].join(', ');

  const updatedTransaction = {
    ...transaction,
    remittanceInformationUnstructured: categoriesStr,
  };

  if (transaction?.creditorName) {
    updatedTransaction.debtorName = merchant;
  } else if (transaction?.debtorName) {
    updatedTransaction.creditorName = merchant;
  } else {
    updatedTransaction.remittanceInformationUnstructured = merchant;
  }

  return updatedTransaction;
}

export function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

export function applyTitleCaseToFields(transaction, fields) {
  fields.forEach((field) => {
    if (transaction[field]) {
      transaction[field] = toTitleCase(transaction[field]);
    }
  });
  return transaction;
}
