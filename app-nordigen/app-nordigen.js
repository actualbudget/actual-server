const jwt = require('jws');
const express = require('express');
const NordigenClient = require('./nordigen-node/index').default;

const {handleError} = require('./../util/handle-error');
const nordigenService = require('./services/nordigen-service');
const BankFactory = require('./banks');

const app = express();

let nordigenClient;

function init() {
  nordigenClient = new NordigenClient({
    secretId: process.env.SECRET_ID,
    secretKey: process.env.SECRET_KEY
  });
}

async function validateToken(req, res) {
  const {requisitionId} = req.body;
  let requisition;
  try {
    requisition = await nordigenClient.requisition.getRequisitionById(
      requisitionId
    )
  } catch (error) {
    console.log({requisition})
    res.send(
      JSON.stringify({
        status: 'error',
        data: {
          error,
          reason: "Can't fetch data from the Nordigen API"
        }
      })
    );
    return;
  }
  ;

  const {status} = requisition;
  /* eslint-disable no-fallthrough */
  switch (status) {
    // { "short": "LN", "long": "LINKED", "description": "Account has been successfully linked to requisition" },
    case 'LN':
      return requisition;
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
      return {};
    // { "short": "EX", "long": "EXPIRED", "description": "Access to account has expired as set in End User Agreement" },
    case 'EX':
      res.send(
        JSON.stringify({
          status: 'ok',
          data: {
            error_type: 'ITEM_ERROR',
            error_code: 'ITEM_LOGIN_REQUIRED',
            status: 'expired',
            reason: 'Access to account has expired as set in End User Agreement'
          }
        })
      );
      return {};
    // { "short": "RJ", "long": "REJECTED", "description": "SSN verification has failed" },
    case 'RJ':
      res.send(
        JSON.stringify({
          status: 'ok',
          data: {
            error_type: 'INVALID_INPUT',
            error_code: 'INVALID_ACCESS_TOKEN',
            status: 'rejected',
            reason: 'SSN verification has failed'
          }
        })
      );
      return {};
    default:
      return {};
  }
  /* eslint-enable no-fallthrough */
}

async function getNordigenToken() {
  const generateToken = async () => {
    let tokenData;
    try {
      tokenData = await nordigenClient.generateToken();
    } catch (e) {
      throw new Error('can not generate token');
    }
    nordigenClient.token = tokenData.access;
  }

  if (nordigenClient.token) {
    var decodedToken = jwt.decode(nordigenClient.token);
    var payload = decodedToken.payload;
    var clockTimestamp = Math.floor(Date.now() / 1000);
    if (clockTimestamp >= payload.exp) {
      await generateToken();
    }
  } else {
    await generateToken();
  }
}

app.use(express.json());

app.post(
  '/create-web-token',
  handleError(async (req, res) => {
    res.type('json')

    const {accessValidForDays, institutionId} = req.body;
    const {origin} = req.headers;
    const {link, requisitionId} = await nordigenService.createRequisition({
      accessValidForDays,
      institutionId,
      host: origin
    })

    res.send(
      JSON.stringify({
        status: 'ok',
        data: {
          link,
          requisitionId
        }
      })
    );
  })
);

app.post(
  '/get-web-token-contents', // TODO: Change endpoint name
  handleError(async (req, res) => {
    const {requisitionId} = req.body;
    const requisition = await nordigenService.getRequisition(requisitionId);
    const {status, accounts: accountIds} = requisition;

    // LN == Linked - Account has been successfully linked to requisition
    if (status !== 'LN') {
      res.send({
          status: 'ok',
          data: {status}
        }
      );
      return;
    }

    let institutionIdSet = new Set()
    const detailedAccounts = await Promise.all(accountIds.map(async (accountId) => {
      const account = await nordigenService.getDetailedAccount({accountId});
      institutionIdSet.add(account.institution_id)
      return account;
    }));

    const institutions = await Promise.all(
      Array.from(institutionIdSet).map(async (institutionId) => {
        return await nordigenService.getInstitution({institutionId});
      })
    );

    const extendedAccounts = await nordigenService.extendAccountsAboutInstitutions({
      accounts: detailedAccounts,
      institutions
    });

    extendedAccounts.map((account) => {
      const bankAccount = BankFactory(account.institution_id);
      return bankAccount.normalizeAccount(account);
    })

    res.send({
        status: 'ok',
        data: {
          ...requisition,
          extendedAccounts
        }
      }
    );
  })
);

app.post(
  '/remove-account',
  handleError(async (req, res) => {
    let {requisitionId} = req.body;

    const data = await nordigenService.deleteRequisition(requisitionId);
    if (data.summary === 'Requisition deleted') {
      res.send({
        status: 'ok',
        data
      });
    } else {
      res.send({
        status: 'error',
        data: {
          data,
          reason: "Can not delete requisition"
        }
      })
    }
  })
);

app.post(
  '/transactions',
  handleError(async (req, res) => {
    try {
      await getNordigenToken();
    } catch (error) {
      res.send({
          status: 'error',
          data: {
            error,
            reason: "Can't fetch data from the Nordigen API"
          }
        }
      );
      return;
    }
    const {institution_id} = await validateToken(req, res);
    if (!institution_id) {
      return;
    }

    const {startDate, endDate, accountId} = req.body;

    const [transactions, accountBalance] = await Promise.all([
      nordigenClient
        .account(accountId)
        .getTransactions({dateFrom: startDate, dateTo: endDate}),
      nordigenClient.account(accountId).getBalances()
    ]);

    switch (transactions.status_code) {
      case 429:
        res.send(
          {
            status: 'ok',
            data: {
              error_type: 'SYNC_ERROR',
              error_code: 'REQUEST_LIMIT_EXCEEDED',
              status: 'limit exceeded',
              reason: transactions.detail
            }
          }
        );
        return;
      case 401:
        res.send(
          {
            status: 'ok',
            data: {
              error_type: 'SYNC_ERROR',
              error_code: 'Connection expired',
              status: 'limit exceeded',
              reason: transactions.detail
            }
          }
        );
        return;
    }

    const sortedBookedTransactions = sortTransactions(
      institution_id,
      transactions.transactions?.booked ?? []
    );

    const sortedPendingTransactions = sortTransactions(
      institution_id,
      transactions.transactions?.pending ?? []
    );

    const startingBalance = countPreviousBalance(
      institution_id,
      sortedBookedTransactions,
      accountBalance.balances
    );

    res.send({
        status: 'ok',
        data: {
          balances: accountBalance.balances,
          institutionId: institution_id,
          startingBalance,
          transactions: {
            booked: sortedBookedTransactions,
            pending: sortedPendingTransactions
          }
        }
      }
    );
  })
);

function sortTransactions(institution_id, transactions = []) {
  switch (institution_id) {
    case 'SANDBOXFINANCE_SFIN0000':
      return transactions.sort((a, b) => {
        const [aTime, aSeq] = a.transactionId.split('-');
        const [bTime, bSeq] = b.transactionId.split('-');

        return bTime - aTime || bSeq - aSeq;
      });
    case 'ING_PL_INGBPLPW':
      return transactions.sort((a, b) => {
        return b.transactionId.substr(2) - a.transactionId.substr(2);
      });
    case 'MBANK_RETAIL_BREXPLPW':
    case 'REVOLUT_REVOGB21':
      return transactions.sort((a, b) => b.transactionId - a.transactionId);
    default:
      return transactions;
  }
}

function countPreviousBalance(
  institution_id,
  transactions = [],
  accountBalances = []
) {

  const oldestTransaction = transactions[transactions.length - 1];

  switch (institution_id) {
    case 'ING_PL_INGBPLPW':
      if (transactions.length) {
        return (
          oldestTransaction.balanceAfterTransaction.balanceAmount.amount -
          oldestTransaction.transactionAmount.amount
        );
      } else {
        (accountBalances.find((balance) => ['interimBooked'].includes(balance.balanceType))).balanceAmount.amount
      }

    case 'MBANK_RETAIL_BREXPLPW':
    case 'REVOLUT_REVOGB21':
    case 'SANDBOXFINANCE_SFIN0000':
    default:
      /* eslint-disable no-case-declarations */
      const balance =
        accountBalances.find((balance) =>
          ['interimBooked', 'interimAvailable'].includes(balance.balanceType)
        ) || accountBalances[0];
      console.log({balance, accountBalances, transactions})
      if (balance && transactions.length) {
        const accountBalance = balance.balanceAmount.amount;
        /* eslint-enable no-case-declarations */
        return transactions.reduce((total, trans) => {
          return total - trans.transactionAmount.amount;
        }, accountBalance);
      } else {
        return
      }
  }
}

module.exports.handlers = app;
module.exports.init = init;
