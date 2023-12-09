import axios from 'axios';
import { isCreditedTransaction } from './apply-pattern.js';

export default function categorise(transactions) {
  const ntropy = axios.create({
    baseURL: 'https://api.ntropy.com/v2',
    headers: {
      'X-API-KEY': '0QtjNbwzm2LIrpTGwcMZDkf62b4qjlqdmnAoTXBr',
    },
  });

  let data = transactions.map((transaction) => {
    return {
      description: transaction.debtorName,
      entry_type: isCreditedTransaction(transaction) ? 'credit' : 'debit',
      amount: Math.abs(transaction.amount),
      iso_currency_code: 'GBP',
      date: transaction.date,
      country: 'UK',
      account_holder_id: 'ah-1',
      account_holder_type: 'consumer',
      transaction_id: transaction.transactionId,
    };
  });

  ntropy
    .post('/transactions/sync', data)
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.error(err?.response?.data || err);
    });
}
