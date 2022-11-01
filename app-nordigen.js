const jwt = require('jws');
const express = require('express');
const uuid = require('uuid');
const NordigenClient = require('./nordigen-node/index').default;

const { handleError } = require('./util/handle-error');

const app = express();

let nordigenClient;

function init() {
  nordigenClient = new NordigenClient({
    secretId: process.env.SECRET_ID,
    secretKey: process.env.SECRET_KEY
  });
}

async function validateToken(req, res) {
  const { requisitionId } = req.body;
  let requisition;
  try {
    requisition = await nordigenClient.requisition.getRequisitionById(
    requisitionId
  )} catch (error) {
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
  };

  const { status } = requisition;
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

async function getNorgigenToken() {
  if (nordigenClient.token) {
    var decodedToken = jwt.decode(nordigenClient.token);
    var payload = decodedToken.payload;
    var clockTimestamp = Math.floor(Date.now() / 1000);
    if (clockTimestamp >= payload.exp) {
      const tokenData = await nordigenClient.generateToken();
      nordigenClient.token = tokenData.access;
    }
  } else {
    const tokenData = await nordigenClient.generateToken();
    nordigenClient.token = tokenData.access;
  }
}

app.post(
  '/create-web-token',
  handleError(async (req, res) => {
    const { accessValidForDays, institutionId } = req.body;

    const tokenData = await nordigenClient.generateToken();
    nordigenClient.token = tokenData.access;

    // Initialize new bank session
    const { link, id: requisitionId } = await nordigenClient.initSession({
      redirectUrl: req.headers.origin + '/nordigen/link',
      institutionId,
      referenceId: uuid.v4(),
      accessValidForDays
    });

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
  '/get-web-token-contents',
  handleError(async (req, res) => {
    const { requisitionId } = req.body;

    const requisition = await nordigenClient.requisition.getRequisitionById(
      requisitionId
    );
    const { status, accounts } = requisition;

    // LN == Linked - Account has been successfully linked to requisition
    if (status !== 'LN') {
      res.send(
        JSON.stringify({
          status: 'ok'
        })
      );
      return;
    }

    // Fetch accounts
    const detailedAccounts = await Promise.all(
      accounts.map(async (accountId) => {
        const [detailedAccount, metadataAccount] = await Promise.all([
          nordigenClient.account(accountId).getDetails(),
          nordigenClient.account(accountId).getMetadata()
        ]);

        return {
          ...detailedAccount.account,
          ...metadataAccount
        };
      })
    );

    // Fetch banks
    const institutionIds = Array.from(
      new Set(detailedAccounts.map((account) => account.institution_id))
    );
    const institutions = await Promise.all(
      institutionIds.map((institutionId) => {
        return nordigenClient.institution.getInstitutionById(institutionId);
      })
    );

    // Extend accounts about institution details
    detailedAccounts.forEach((account) => {
      const institution = institutions.find(
        (institution) => institution.id === account.institution_id
      );
      account.institution = institution;
    });

    const normalizedAccounts = detailedAccounts.map((acc) =>
      normalizeAccount(acc)
    );

    console.log({
      detailedAccounts,
      institutions,
      institutionIds,
      normalizedAccounts
    });

    res.send(
      JSON.stringify({
        status: 'ok',
        data: {
          ...requisition,
          accounts: normalizedAccounts
        }
      })
    );
  })
);

app.post(
  '/remove-account',
  handleError(async (req, res) => {
    let { requisition_id } = req.body;

    await nordigenClient.requisition.deleteRequisition(requisition_id);

    res.send(
      JSON.stringify({
        status: 'ok'
      })
    );
  })
);

app.post(
  '/transactions',
  handleError(async (req, res) => {
    try {
      await getNorgigenToken();
    } catch (error) {
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

    const { institution_id } = await validateToken(req, res);
    if (!institution_id) {
      return;
    }

    const { startDate, endDate, accountId } = req.body;

    const [transactions, accountBalance] = await Promise.all([
      nordigenClient
        .account(accountId)
        .getTransactions({ dateFrom: startDate, dateTo: endDate }),
      nordigenClient.account(accountId).getBalances()
    ]);

    switch(transactions.status_code) {
      case 429:
        res.send(
          JSON.stringify({
            status: 'ok',
            data: {
              error_type: 'SYNC_ERROR',
              error_code: 'REQUEST_LIMIT_EXCEEDED',
              status: 'limit exceeded',
              reason: transactions.detail
            }
          })
        );
        return;
      case 401:
        res.send(
          JSON.stringify({
            status: 'ok',
            data: {
              error_type: 'SYNC_ERROR',
              error_code: 'Connection expired',
              status: 'limit exceeded',
              reason: transactions.detail
            }
          })
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

    res.send(
      JSON.stringify({
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
      })
    );
  })
);

const printIban = (account) => {
  if (account.iban) {
    return '(XXX ' + account.iban.slice(-4) + ')';
  } else {
    return '';
  }
};

// https://nordigen.com/en/docs/account-information/output/accounts/
// https://docs.google.com/spreadsheets/d/11tAD5cfrlaOZ4HXI6jPpL5hMf8ZuRYc6TUXTxZE84A8/edit#gid=489769432
function normalizeAccount(account) {
  switch (account.institution_id) {
    case 'MBANK_RETAIL_BREXPLPW':
      return {
        account_id: account.id,
        institution: account.institution,
        mask: account.iban.slice(-4),
        name: [account.displayName, printIban(account)].join(' '),
        official_name: account.product,
        type: 'checking'
      };
    case 'SANDBOXFINANCE_SFIN0000':
      return {
        account_id: account.id,
        institution: account.institution,
        mask: account.iban.slice(-4),
        name: [account.name, printIban(account)].join(' '),
        official_name: account.product,
        type: 'checking'
      };
    case 'ING_PL_INGBPLPW':
    case 'REVOLUT_REVOGB21':
    default:
      return {
        account_id: account.id,
        institution: account.institution,
        mask: account.iban.slice(-4),
        name: [account.product, printIban(account)].join(' '),
        official_name: account.product,
        type: 'checking'
      };
  }
}

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
      if(transactions.length) {
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
      if(balance && transactions.length){
        const accountBalance = balance.balanceAmount.amount;
      /* eslint-enable no-case-declarations */
        return transactions.reduce((total, trans) => {
          return total - trans.transactionAmount.amount;
        }, accountBalance);
      }else {
        return
      }
  }
}

module.exports.handlers = app;
module.exports.init = init;
