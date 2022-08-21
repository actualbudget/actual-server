const jwt = require("jws")
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
  const requisition = await nordigenClient.requisition.getRequisitionById(requisitionId);
  const { status } = requisition;

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
      res.send(JSON.stringify({
        status: 'ok',
        data: {
         error_type: 'ITEM_ERROR',
         error_code: 'ITEM_LOGIN_REQUIRED',
         status: 'expired',
         reason: 'Access to account has expired as set in End User Agreement'
        }
      }));
      return {};
    // { "short": "RJ", "long": "REJECTED", "description": "SSN verification has failed" },
    case 'RJ':
      res.send(JSON.stringify({
        status: 'ok',
        data: {
          error_type: 'INVALID_INPUT',
          error_code: 'INVALID_ACCESS_TOKEN',
          status: 'rejected',
          reason: 'SSN verification has failed'
        }
      }));
      return {};
    default:
      return {};
  }
}

async function getNorgigenToken() {
  if (nordigenClient.token) {
    var decodedToken = jwt.decode(nordigenClient.token);
    var payload = decodedToken.payload;
    var clockTimestamp = Math.floor(Date.now() / 1000);
    if (clockTimestamp >= payload.exp) {
      const tokenData = await nordigenClient.generateToken();
      nordigenClient.token = tokenData.access
    }
  } else {
    const tokenData = await nordigenClient.generateToken();
    nordigenClient.token = tokenData.access
  }
}

app.post('/create-web-token', handleError(async (req, res) => {
    const {accessValidForDays, institutionId} = req.body;

    const tokenData = await nordigenClient.generateToken();
    nordigenClient.token = tokenData.access

    // Initialize new bank session
    const { link, id: requisitionId } = await nordigenClient.initSession({
      redirectUrl: req.headers.origin + "/nordigen/link",
      institutionId,
      referenceId: uuid.v4(),
      accessValidForDays
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
  '/get-web-token-contents',
  handleError(async (req, res) => {
    const { requisitionId } = req.body;

    const requisition = await nordigenClient.requisition.getRequisitionById(requisitionId);
    const { status, accounts } = requisition;

    // LN == Linked - Account has been successfully linked to requisition
    if(status !== 'LN') {
      res.send(
        JSON.stringify({
          status: 'ok',
        }));
      return;
    }

    // Fetch accounts
    const detailedAccounts = (await Promise.all(
      accounts.map(async (accountId) => {
        const [detailedAccount, metadataAccount] = await Promise.all([
          nordigenClient.account(accountId).getDetails(),
          nordigenClient.account(accountId).getMetadata(),
        ]);

        return {
          ...detailedAccount.account,
          ...metadataAccount
        }
      })
    ))

    // Fetch banks
    const institutionIds = Array.from(new Set(detailedAccounts.map((account) => account.institution_id)));
    const institutions = (await Promise.all(
      institutionIds.map((institutionId) => {
        return nordigenClient.institution.getInstitutionById(institutionId);
      })
    ));

    // Extend accounts about institution details
    detailedAccounts.forEach((account) => {
      const institution = institutions.find((institution) => institution.id === account.institution_id)
      account.institution = institution;
    })

    console.log({detailedAccounts, institutions, institutionIds})

    res.send(
      JSON.stringify({
        status: 'ok',
        data: {
          ...requisition,
          accounts: detailedAccounts,
        }
      })
    );
  })
);

app.post('/remove-account', handleError(async (req, res) => {
  let { requisition_id } = req.body;

  await nordigenClient.requisition.deleteRequisition(requisition_id);

  res.send(
    JSON.stringify({
      status: 'ok',
    })
  );
}));

app.post('/transactions', handleError(async (req, res) => {
    await getNorgigenToken();

  const { institution_id } = await validateToken(req, res)
    if (!institution_id) {
      return;
    }

    const { startDate, endDate, accountId } = req.body;

    const [transactions, accountBalance] = await Promise.all([
      nordigenClient.account(accountId).getTransactions({dateFrom: startDate, dateTo: endDate}),
      nordigenClient.account(accountId).getBalances(),
    ]);

    res.send(
      JSON.stringify({
        status: 'ok',
        data: {
          institutionId: institution_id,
          transactions: transactions.transactions,
          balances: accountBalance.balances
        }
      })
    );
  })
);

module.exports.handlers = app;
module.exports.init = init;
