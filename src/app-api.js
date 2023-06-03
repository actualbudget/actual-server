import express from 'express';
import errorMiddleware from './util/error-middleware.js';
import api from '@actual-app/api';
import session from 'express-session';

import { generateToken, getCredsForSession } from './util/session.js';
import {
  redisClient,
  redisStore,
  redlock,
  credsPrefix,
  oneDay,
  config,
} from './util/api-config.js';

let app = express();
app.use(errorMiddleware);

// Set up session middleware
app.use(
  session({
    store: redisStore,
    secret: 'LdwOkFovTczXw/dm+RWjCCOvylnSPhP+yOf6LtXDN7I=',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: oneDay },
  }),
);

export { app as handlers };

export function init() {
  // eslint-disable-previous-line @typescript-eslint/no-empty-function
}

// Non-authenticated endpoints:
//
// /needs-bootstrap
// /boostrap (special endpoint for setting up the instance, cant call again)
// /login

let actualApp;

// Set up an authentication route that returns a token
app.post('/init', async (req, res) => {
  try {
    console.log(config);
    if (!actualApp) actualApp = await api.init(config);
    if (actualApp) {
      const creds = {
        budgetId: req.body.budgetId,
        password: req.body.password,
      };
      await api.downloadBudget(creds.budgetId, {
        password: creds.password,
      });
      const token = generateToken({ budgetId: creds.budgetId });
      await redisClient.set(
        credsPrefix + req.session.id,
        JSON.stringify(creds),
      );
      // Store the token in the session
      req.session.token = token;
      res.end('OK');
    } else {
      res.status(401).send('BAD');
    }
  } catch (error) {
    res.status(401).send(error.message);
  }
});

app.post('/shutdown', async (req, res) => {
  if (actualApp) {
    await api.shutdown();
    actualApp = null;
  }
  req.session.destroy();
  res.end('OK');
});

// Expose all the API functions as RESTful endpoints
app.post('/query', async (req, res, next) => {
  // get creds for session
  try {
    const creds = await getCredsForSession(req.session.id, req.session.token);
    const result = await redlock.using(
      [creds.budgetId],
      5000,
      async (signal) => {
        await api.downloadBudget(creds.budgetId, {
          password: creds.password,
        });
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
app.post('/:function', async (req, res, next) => {
  // get creds for session
  try {
    const creds = await getCredsForSession(req.session.id, req.session.token);
    const result = await redlock.using(
      [creds.budgetId],
      5000,
      async (signal) => {
        await api.downloadBudget(creds.budgetId, {
          password: creds.password,
        });
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
