const express = require('express');

const { nordigenService } = require('./services/nordigen-service');
const { RequisitionNotLinked, AccountNotLinedToRequisition, GenericNordigenError } = require('./errors');
const { handleError } = require('../build/util/handle-error');

const app = express();

app.use(express.json());

app.post(
  '/create-web-token',
  handleError(async (req, res) => {
    const { accessValidForDays, institutionId } = req.body;
    const { origin } = req.headers;

    const { link, requisitionId } = await nordigenService.createRequisition({
      accessValidForDays,
      institutionId,
      host: origin
    });

    res.send({
      status: 'ok',
      data: {
        link,
        requisitionId
      }
    });
  })
);

app.post(
  '/get-accounts',
  handleError(async (req, res) => {
    const { requisitionId } = req.body;

    try {
      const { requisition, accounts } = await nordigenService.getRequisitionWithAccounts(requisitionId);

      res.send({
        status: 'ok',
        data: {
          ...requisition,
          accounts
        }
      });
    } catch (error) {
      if (error instanceof RequisitionNotLinked) {
        res.send({
          status: 'ok',
          requisitionStatus: error.details.requisitionStatus
        });
      } else {
        throw error;
      }
    }
  })
);

app.post(
  '/remove-account',
  handleError(async (req, res) => {
    let { requisitionId } = req.body;

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
          reason: 'Can not delete requisition'
        }
      });
    }
  })
);

app.post(
  '/transactions',
  handleError(async (req, res) => {
    const { requisitionId, startDate, endDate, accountId } = req.body;

    try {
      const {
        balances,
        institutionId,
        startingBalance,
        transactions: { booked, pending }
      } = await nordigenService.getTransactionsWithBalance(requisitionId, accountId, startDate, endDate);

      res.send({
        status: 'ok',
        data: {
          balances,
          institutionId,
          startingBalance,
          transactions: {
            booked,
            pending
          }
        }
      });
    } catch (error) {
      const sendErrorResponse = (data) => res.send({ status: 'ok', data: { ...data, details: error.details } });

      switch (true) {
        case error instanceof RequisitionNotLinked:
          sendErrorResponse({
            error_type: 'ITEM_ERROR',
            error_code: 'ITEM_LOGIN_REQUIRED',
            status: 'expired',
            reason: 'Access to account has expired as set in End User Agreement'
          });
          break;
        case error instanceof AccountNotLinedToRequisition:
          sendErrorResponse({
            error_type: 'INVALID_INPUT',
            error_code: 'INVALID_ACCESS_TOKEN',
            status: 'rejected',
            reason: 'Account not linked with this requisition'
          });
          break;
        case error instanceof GenericNordigenError:
          console.log({ message: 'Something went wrong', error });
          sendErrorResponse({
            error_type: 'SYNC_ERROR',
            error_code: 'NORDIGEN_ERROR'
          });
          break;
        default:
          console.log({ message: 'Something went wrong', error });
          sendErrorResponse({
            error_type: 'UNKNOWN',
            error_code: 'UNKNOWN',
            reason: 'Something went wrong'
          });
          break;
      }
    }
  })
);

module.exports.handlers = app;
