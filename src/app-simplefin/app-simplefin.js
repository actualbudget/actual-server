import express from 'express';
import { inspect } from 'util';
import { SecretName, secretsService } from '../services/secrets-service.js';
import { handleError } from '../app-gocardless/util/handle-error.js';
import { requestLoggerMiddleware } from '../util/middlewares.js';
import { SimpleFinService } from './services/simplefin-service.js';
import { SimplefinApi } from './services/simplefin-api.ts';
import { HttpsClient } from './httpClient.ts';

const app = express();
export { app as handlers };
app.use(express.json());
app.use(requestLoggerMiddleware);

const simplefinService = new SimpleFinService(new SimplefinApi(new HttpsClient()));

app.post(
  '/status',
  handleError(async (req, res) => {
    const token = secretsService.get(SecretName.simplefin_token);
    const configured = token != null && token !== 'Forbidden';

    res.send({
      status: 'ok',
      data: {
        configured: configured,
      },
    });
  }),
);

app.post(
  '/accounts',
  handleError(async (req, res) => {
    let accessKey = secretsService.get(SecretName.simplefin_accessKey);

    try {
      if (accessKey == null || accessKey === 'Forbidden') {
        const token = secretsService.get(SecretName.simplefin_token);
        if (token == null || token === 'Forbidden') {
          throw new Error('No token');
        } else {
          accessKey = await simplefinService.getAccessKey(token);
          secretsService.set(SecretName.simplefin_accessKey, accessKey);
          if (accessKey == null || accessKey === 'Forbidden') {
            throw new Error('No access key');
          }
        }
      }
    } catch (error) {
      invalidToken(res);
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    try {
      const accounts = await simplefinService.getAccounts(accessKey, startDate, endDate);

      res.send({
        status: 'ok',
        data: {
          accounts: accounts.accounts,
        },
      });
    } catch (e) {
      serverDown(e, res);
      return;
    }
  }),
);

app.post(
  '/transactions',
  handleError(async (req, res) => {
    const { accountId, startDate } = req.body;

    const accessKey = secretsService.get(SecretName.simplefin_accessKey);

    if (accessKey == null || accessKey === 'Forbidden') {
      invalidToken(res);
      return;
    }

    let results;
    try {
      results = await simplefinService.getTransactions(accessKey, new Date(startDate));
    } catch (e) {
      serverDown(e, res);
      return;
    }

    try {
      const account = results.accounts.find((a) => a.id === accountId);
      if (!account) {
        console.log(
          `The account "${accountId}" was not found. Here were the accounts returned:`,
        );
        if (results?.accounts)
          results.accounts.forEach((a) =>
            console.log(`${a.id} - ${a.org.name}`),
          );
        res.send({
          status: 'ok',
          data: {
            error_type: 'ACCOUNT_MISSING',
            error_code: 'ACCOUNT_MISSING',
            status: 'rejected',
            reason: `The account "${accountId}" was not found. Try unlinking and relinking the account.`,
          },
        });
        return;
      }

      const needsAttention = results.errors.find(
        (e) => e === `Connection to ${account.org.name} may need attention`,
      );
      if (needsAttention) {
        res.send({
          status: 'ok',
          data: {
            error_type: 'ACCOUNT_NEEDS_ATTENTION',
            error_code: 'ACCOUNT_NEEDS_ATTENTION',
            status: 'rejected',
            reason:
              'The account needs your attention at <a href="https://bridge.simplefin.org/auth/login">SimpleFIN</a>.',
          },
        });
        return;
      }

      const response = {};

      const balance = parseInt(account.balance.replace('.', ''));
      const date = new Date(account['balance-date'] * 1000)
        .toISOString()
        .split('T')[0];

      response.balances = [
        {
          balanceAmount: {
            amount: account.balance,
            currency: account.currency,
          },
          balanceType: 'expected',
          referenceDate: date,
        },
        {
          balanceAmount: {
            amount: account.balance,
            currency: account.currency,
          },
          balanceType: 'interimAvailable',
          referenceDate: date,
        },
      ];
      response.startingBalance = balance; // could be named differently in this use case.

      const allTransactions = [];
      const bookedTransactions = [];
      const pendingTransactions = [];

      for (const trans of account.transactions) {
        const newTrans = {};

        let dateToUse = 0;

        if (trans.posted == 0) {
          newTrans.booked = false;
          dateToUse = trans.transacted_at;
        } else {
          newTrans.booked = true;
          dateToUse = trans.posted;
        }

        newTrans.bookingDate = new Date(dateToUse * 1000)
          .toISOString()
          .split('T')[0];

        newTrans.date = new Date(dateToUse * 1000).toISOString().split('T')[0];
        newTrans.payeeName = trans.payee;
        newTrans.remittanceInformationUnstructured = trans.description;
        newTrans.transactionAmount = { amount: trans.amount, currency: 'USD' };
        newTrans.transactionId = trans.id;
        newTrans.valueDate = new Date(dateToUse * 1000)
          .toISOString()
          .split('T')[0];

        if (newTrans.booked) {
          bookedTransactions.push(newTrans);
        } else {
          pendingTransactions.push(newTrans);
        }
        allTransactions.push(newTrans);
      }

      response.transactions = {
        all: allTransactions,
        booked: bookedTransactions,
        pending: pendingTransactions,
      };

      res.send({
        status: 'ok',
        data: response,
      });
    } catch (error) {
      const sendErrorResponse = (data) =>
        res.send({ status: 'ok', data: { ...data, details: error.details } });
      console.log(
        'Something went wrong',
        inspect(error, { depth: null }),
        sendErrorResponse,
      );
    }
  }),
);

function invalidToken(res) {
  res.send({
    status: 'ok',
    data: {
      error_type: 'INVALID_ACCESS_TOKEN',
      error_code: 'INVALID_ACCESS_TOKEN',
      status: 'rejected',
      reason:
        'Invalid SimpleFIN access token.  Reset the token and re-link any broken accounts.',
    },
  });
}

function serverDown(e, res) {
  console.log(e);
  res.send({
    status: 'ok',
    data: {
      error_type: 'SERVER_DOWN',
      error_code: 'SERVER_DOWN',
      status: 'rejected',
      reason: 'There was an error communciating with SimpleFIN.',
    },
  });
}