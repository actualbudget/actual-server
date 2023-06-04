import express from 'express';
import errorMiddleware from './util/error-middleware.js';
import api from '@actual-app/api';
import audit from 'express-requests-logger';

import {
  generateToken,
  getCreds,
  authenticateToken,
  authenticateAndReturnToken,
} from './util/api-jwt.js';
import {
  redisClient,
  credsPrefix,
  redlock,
  jwtr,
  config,
} from './util/api-config.js';

const app = express();
app.use(errorMiddleware);
if (process.env.NODE_ENV === 'development') app.use(audit());

export { app as handlers };

export function init() {
  // eslint-disable-previous-line @typescript-eslint/no-empty-function
}

// Set up an authentication route that returns a token
app.post('/init', async (req, res) => {
  const jti = await authenticateAndReturnToken(req);
  if (jti) {
    try {
      await jwtr.destroy(jti);
      await redisClient.del(credsPrefix + jti);
    } catch (err) {
      console.log(err);
    }
  }
  await api.init({ ...config, password: req.body.password });
  const creds = {
    password: req.body.password,
    budgetId: req.body.budgetId,
    budgetPassword: req.body.budgetPassword,
  };
  await api.downloadBudget(creds.budgetId, {
    password: creds.budgetPassword,
  });
  const token = await generateToken();
  const decodedToken = (await jwtr.decode(token)) as {
    jti: string;
    exp: number;
  };
  await redisClient.set(credsPrefix + decodedToken.jti, JSON.stringify(creds));
  await redisClient.expireAt(credsPrefix + decodedToken.jti, decodedToken.exp);
  res.status(200).send({ token });
});

app.post('/shutdown', authenticateToken, async (req, res) => {
  await jwtr.destroy(req.jti);
  await redisClient.del(credsPrefix + req.jti);
  res.sendStatus(200);
});

// Expose all the API functions as RESTful endpoints
app.post('/query', authenticateToken, async (req, res, next) => {
  // get creds for session
  try {
    const creds = await getCreds(req.jti);
    const result = await redlock.using(
      [creds.budgetId],
      5000,
      async (signal) => {
        try {
          await api.downloadBudget(creds.budgetId, {
            password: creds.budgetPassword,
          });
        } catch (err) {
          if (
            err.name === 'TypeError' &&
            err.message === 'injected.send is not a function'
          ) {
            await api.init({ ...config, password: creds.password });
            await api.downloadBudget(creds.budgetId, {
              password: creds.budgetPassword,
            });
          }
        }
        // build graphql functions. Iterate over the json body with key name being function names and key value being the function argument
        const body = req.body;
        const f = function () {
          let a = api;
          for (const [key, value] of Object.entries(body)) {
            // only proceed if the function is found in @actual-app/api
            if (!a[key]) {
              res.status(404).send('Function not found');
            }
            a = a[key](value);
          }
          return a;
        };
        const q = f();
        console.log(q);
        if (signal.aborted) {
          next(signal.error);
        }
        return await api.runQuery(q);
      },
    );
    res.send(result);
  } catch (err) {
    next(err);
  }
});

// Expose all the API functions as RESTful endpoints
app.post('/:function', authenticateToken, async (req, res, next) => {
  try {
    const creds = await getCreds(req.jti);
    const result = await redlock.using(
      [creds.budgetId],
      5000,
      async (signal) => {
        try {
          await api.downloadBudget(creds.budgetId, {
            password: creds.budgetPassword,
          });
        } catch (err) {
          if (
            err.name === 'TypeError' &&
            err.message === 'injected.send is not a function'
          ) {
            await api.init({ ...config, password: creds.password });
            await api.downloadBudget(creds.budgetId, {
              password: creds.budgetPassword,
            });
          }
        }
        // Get the function name from the URL
        const functionName = req.params.function;
        // only proceed if the function is found in @actual-app/api
        if (!api[functionName]) {
          res.status(404).send('Function not found');
        }
        const body = req.body;
        if (signal.aborted) {
          next(signal.error);
        }
        return req.query.paramsInBody
          ? await api[functionName](...body._)
          : await api[functionName](body);
      },
    );
    res.send(result);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);
