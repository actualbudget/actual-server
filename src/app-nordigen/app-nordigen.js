import { isAxiosError } from 'axios';
import express from 'express';
import path from 'path';
import { inspect } from 'util';

import { nordigenService } from './services/nordigen-service.js';
import {
  RequisitionNotLinked,
  AccountNotLinedToRequisition,
  GenericNordigenError,
} from './errors.js';
import { handleError } from './util/handle-error.js';
import { sha256String } from '../util/hash.js';
import validateUser from '../util/validate-user.js';

const app = express();
app.get('/link', function (req, res) {
  res.sendFile('link.html', { root: path.resolve('./src/app-nordigen') });
});

export { app as handlers };
app.use(express.json());
app.use(async (req, res, next) => {
  let user = await validateUser(req, res);
  if (!user) {
    return;
  }
  next();
});

app.post('/status', async (req, res) => {
  res.send({
    status: 'ok',
    data: {
      configured: nordigenService.isConfigured(),
    },
  });
});

app.post(
  '/create-web-token',
  handleError(async (req, res) => {
    const { accessValidForDays, institutionId } = req.body;
    const { origin } = req.headers;

    const { link, requisitionId } = await nordigenService.createRequisition({
      accessValidForDays,
      institutionId,
      host: origin,
    });

    res.send({
      status: 'ok',
      data: {
        link,
        requisitionId,
      },
    });
  }),
);

app.post(
  '/get-accounts',
  handleError(async (req, res) => {
    const { requisitionId } = req.body;

    try {
      const { requisition, accounts } =
        await nordigenService.getRequisitionWithAccounts(requisitionId);

      res.send({
        status: 'ok',
        data: {
          ...requisition,
          accounts: await Promise.all(
            accounts.map(async (account) =>
              account?.iban
                ? { ...account, iban: await sha256String(account.iban) }
                : account,
            ),
          ),
        },
      });
    } catch (error) {
      if (error instanceof RequisitionNotLinked) {
        res.send({
          status: 'ok',
          requisitionStatus: error.details.requisitionStatus,
        });
      } else {
        throw error;
      }
    }
  }),
);

app.post(
  '/get-banks',
  handleError(async (req, res) => {
    let { country, showDemo = false } = req.body;

    await nordigenService.setToken();
    const data = await nordigenService.getInstitutions(country);

    res.send({
      status: 'ok',
      data: showDemo
        ? [
            {
              id: 'SANDBOXFINANCE_SFIN0000',
              name: 'DEMO bank (used for testing bank-sync)',
            },
            ...data,
          ]
        : data,
    });
  }),
);

app.post(
  '/remove-account',
  handleError(async (req, res) => {
    let { requisitionId } = req.body;

    const data = await nordigenService.deleteRequisition(requisitionId);
    if (data.summary === 'Requisition deleted') {
      res.send({
        status: 'ok',
        data,
      });
    } else {
      res.send({
        status: 'error',
        data: {
          data,
          reason: 'Can not delete requisition',
        },
      });
    }
  }),
);

app.post(
  '/transactions',
  handleError(async (req, res) => {
    const { requisitionId, startDate, endDate, accountId } = req.body;

    try {
      const {
        iban,
        balances,
        institutionId,
        startingBalance,
        transactions: { booked, pending, all },
      } = await nordigenService.getTransactionsWithBalance(
        requisitionId,
        accountId,
        startDate,
        endDate,
      );

      res.send({
        status: 'ok',
        data: {
          iban: iban ? await sha256String(iban) : null,
          balances,
          institutionId,
          startingBalance,
          transactions: {
            booked,
            pending,
            all,
          },
        },
      });
    } catch (error) {
      const sendErrorResponse = (data) =>
        res.send({ status: 'ok', data: { ...data, details: error.details } });

      switch (true) {
        case error instanceof RequisitionNotLinked:
          sendErrorResponse({
            error_type: 'ITEM_ERROR',
            error_code: 'ITEM_LOGIN_REQUIRED',
            status: 'expired',
            reason:
              'Access to account has expired as set in End User Agreement',
          });
          break;
        case error instanceof AccountNotLinedToRequisition:
          sendErrorResponse({
            error_type: 'INVALID_INPUT',
            error_code: 'INVALID_ACCESS_TOKEN',
            status: 'rejected',
            reason: 'Account not linked with this requisition',
          });
          break;
        case error instanceof GenericNordigenError:
          console.log('Something went wrong', inspect(error, { depth: null }));
          sendErrorResponse({
            error_type: 'SYNC_ERROR',
            error_code: 'NORDIGEN_ERROR',
          });
          break;
        case isAxiosError(error):
          console.log(
            'Something went wrong',
            inspect(error.response.data, { depth: null }),
          );
          sendErrorResponse({
            error_type: 'SYNC_ERROR',
            error_code: 'NORDIGEN_ERROR',
          });
          break;
        default:
          console.log('Something went wrong', inspect(error, { depth: null }));
          sendErrorResponse({
            error_type: 'UNKNOWN',
            error_code: 'UNKNOWN',
            reason: 'Something went wrong',
          });
          break;
      }
    }
  }),
);
