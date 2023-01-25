const jwt = require('jws');
const express = require('express');
const NordigenClient = require('./nordigen-node/index').default;

const {handleError} = require('./../util/handle-error');
const nordigenService = require('./services/nordigen-service');
const BankFactory = require('./banks');

const app = express();

let nordigenClient;

const init = () => {
  nordigenClient = new NordigenClient({
    secretId: process.env.SECRET_ID, secretKey: process.env.SECRET_KEY
  });
}

/**
 * Fetches the requisition, validate if it's in the correct status and if we work with linked account
 * @param req
 * @param res
 * @returns {Promise<Requisition|undefined>}
 */
const fetchAndValidateRequisition = async (req, res) => {
  const {requisitionId, accountId} = req.body;

  const requisition = await nordigenService.getRequisition(requisitionId);
  const {status, accounts} = requisition;

  if (!accounts.includes(accountId)) {
    res.send({
      status: 'ok', data: {
        error_type: 'INVALID_INPUT',
        error_code: 'INVALID_ACCESS_TOKEN',
        status: 'rejected',
        reason: 'Account not linked with this requisition'
      }
    });
    return;
  }

  console.log({requisition})

  switch (status) {
    // { "short": "LN", "long": "LINKED", "description": "Account has been successfully linked to requisition" },
    case 'LN':
      break;
    // { "short": "CR", "long": "CREATED", "description": "Requisition has been successfully created" },
    case 'CR':
    // { "short": "GC", "long": "GIVING_CONSENT", "description": "End-user is giving consent at Nordigen's consent screen" }
    case 'GC':
    // { "short": "UA", "long": "UNDERGOING_AUTHENTICATION", "description": "End-user is redirected to the financial institution for authentication" },
    case 'UA':
    // { "short": "GA", "long": "GRANTING_ACCESS", "description": "End-user is granting access to their account information" },
    case 'GA':
    // { "short": "SA", "long": "SELECTING_ACCOUNTS", "description": "End-user is selecting accounts" },
    case 'SA':
      break;
    // { "short": "EX", "long": "EXPIRED", "description": "Access to account has expired as set in End User Agreement" },
    case 'EX':
      res.send({
        status: 'ok', data: {
          error_type: 'ITEM_ERROR',
          error_code: 'ITEM_LOGIN_REQUIRED',
          status: 'expired',
          reason: 'Access to account has expired as set in End User Agreement'
        }
      });
      return;
    // { "short": "RJ", "long": "REJECTED", "description": "SSN verification has failed" },
    case 'RJ':
      res.send({
        status: 'ok', data: {
          error_type: 'INVALID_INPUT',
          error_code: 'INVALID_ACCESS_TOKEN',
          status: 'rejected',
          reason: 'SSN verification has failed'
        }
      });
      return;
    default:
      break;
  }
  return requisition;
}

app.use(express.json());

app.post('/create-web-token', handleError(async (req, res) => {
  const {accessValidForDays, institutionId} = req.body;
  const {origin} = req.headers;
  const {link, requisitionId} = await nordigenService.createRequisition({
    accessValidForDays, institutionId, host: origin
  })

  res.send({
    status: 'ok', data: {
      link, requisitionId
    }
  });
}));

app.post('/get-web-token-contents', // TODO: Change endpoint name
  handleError(async (req, res) => {
    const {requisitionId} = req.body;
    const requisition = await nordigenService.getRequisition(requisitionId);
    const {status, accounts: accountIds} = requisition;

    // LN == Linked - Account has been successfully linked to requisition
    if (status !== 'LN') {
      res.send({
        status: 'ok', requisitionStatus: status,
      });
      return;
    }

    let institutionIdSet = new Set()
    const detailedAccounts = await Promise.all(accountIds.map(async (accountId) => {
      const account = await nordigenService.getDetailedAccount({accountId});
      institutionIdSet.add(account.institution_id)
      return account;
    }));

    const institutions = await Promise.all(Array.from(institutionIdSet).map(async (institutionId) => {
      return await nordigenService.getInstitution({institutionId});
    }));

    const extendedAccounts = await nordigenService.extendAccountsAboutInstitutions({
      accounts: detailedAccounts, institutions
    });

    const normalizedAccounts = extendedAccounts.map(account => {
      const bankAccount = BankFactory(account.institution_id);
      return bankAccount.normalizeAccount(account);
    })

    res.send({
      status: 'ok', data: {
        ...requisition, accounts: normalizedAccounts
      }
    });
  }));

app.post('/remove-account', handleError(async (req, res) => {
  let {requisitionId} = req.body;
  await nordigenService.getRequisition(requisitionId);

  const data = await nordigenService.deleteRequisition(requisitionId);
  if (data.summary === 'Requisition deleted') {
    res.send({
      status: 'ok', data
    });
  } else {
    res.send({
      status: 'error', data: {
        data, reason: "Can not delete requisition"
      }
    })
  }
}));

app.post('/transactions', handleError(async (req, res) => {
  const {institution_id, startDate, endDate, accountId} = req.body;

  const requisition = await fetchAndValidateRequisition(req, res);
  if (!requisition) {
    return;
  }

  const [transactions, accountBalance] = await Promise.all([
    nordigenService.getTransactions({
    accountId,
    startDate,
    endDate
  }), nordigenService.getBalances({accountId}),]);

  switch (transactions.status_code) {
    case 429:
      res.send({
        status: 'ok', data: {
          error_type: 'SYNC_ERROR',
          error_code: 'REQUEST_LIMIT_EXCEEDED',
          status: 'limit exceeded',
          reason: transactions.detail
        }
      });
      return;
    case 401:
      res.send({
        status: 'ok', data: {
          error_type: 'SYNC_ERROR',
          error_code: 'Connection expired',
          status: 'limit exceeded',
          reason: transactions.detail
        }
      });
      return;
  }

  const bank = BankFactory(institution_id);
  const sortedBookedTransactions = bank.sortTransactions(transactions.transactions?.booked)
  const sortedPendingTransactions = bank.sortTransactions(transactions.transactions?.pending);

  const startingBalance = bank.calculateStartingBalance(sortedBookedTransactions, accountBalance.balances)

  res.send({
    status: 'ok', data: {
      balances: accountBalance.balances, institutionId: institution_id, startingBalance, transactions: {
        booked: sortedBookedTransactions, pending: sortedPendingTransactions
      }
    }
  });
}));

module.exports.handlers = app;
module.exports.init = init;
