import express from 'express';
import errorMiddleware from './util/error-middleware.js';
import validateUser, { validateAuthHeader } from './util/validate-user.js';
import {
  bootstrap,
  listLoginMethods,
  needsBootstrap,
  getLoginMethod,
} from './accounts/index.js';
import { loginWithPassword, changePassword } from './accounts/password.js';
import {
  loginWithOpenIdSetup,
  loginWithOpenIdFinalize,
} from './accounts/openid.js';

let app = express();
app.use(errorMiddleware);

export { app as handlers };

// Non-authenticated endpoints:
//
// /needs-bootstrap
// /boostrap (special endpoint for setting up the instance, cant call again)
// /login

app.get('/needs-bootstrap', (req, res) => {
  res.send({
    status: 'ok',
    data: { bootstrapped: !needsBootstrap(), loginMethod: getLoginMethod() },
  });
});

app.post('/bootstrap', (req, res) => {
  let { error } = bootstrap(req.body);

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  } else {
    res.send({ status: 'ok' });
  }

  res.send({ status: 'ok', data: { token } });
});

app.get('/login-methods', (req, res) => {
  let methods = listLoginMethods();
  res.send({ status: 'ok', methods });
});

app.get('/login-methods', (req, res) => {
  let methods = listLoginMethods();
  res.send({ status: 'ok', methods });
});

app.post('/login', (req, res) => {
  let loginMethod = getLoginMethod(req);
  console.log('Logging in via ' + loginMethod);
  let tokenRes = null;
  switch (loginMethod) {
    case 'header': {
      let headerVal = req.get('x-actual-password') || '';
      console.debug('HEADER VALUE: ' + headerVal);
      if (headerVal == '') {
        res.send({ status: 'error', reason: 'invalid-header' });
        return;
      } else {
        if (validateAuthHeader(req)) {
          tokenRes = login(headerVal);
        } else {
          res.send({ status: 'error', reason: 'proxy-not-trusted' });
          return;
        }
      }
      break;
    }
    case 'password':
    default:
      tokenRes = login(req.body.password);
      break;
  }
  let { error, token } = tokenRes;

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  }

  let token = loginWithPassword(req.body.password);
  res.send({ status: 'ok', data: { token } });
});

app.post('/login-openid', async (req, res) => {
  // req.body needs to contain
  // - return_url: address of the actual frontend which we should return to after the openid flow
  let { error, url } = await loginWithOpenIdSetup(req.body);
  if (error) {
    res.send({ status: 'error', reason: error });
    return;
  }
  res.send({ status: 'ok', data: { redirect_url: url } });
});

app.get('/login-openid/cb', async (req, res) => {
  let { error, url } = await loginWithOpenIdFinalize(req.query);
  if (error) {
    res.send({ error });
    return;
  }

  res.redirect(url);
});

app.post('/change-password', (req, res) => {
  let user = validateUser(req, res);
  if (!user) return;

  let { error } = changePassword(req.body.password);

  if (error) {
    res.send({ status: 'error', reason: error });
    return;
  }

  res.send({ status: 'ok', data: {} });
});

app.get('/validate', (req, res) => {
  let user = validateUser(req, res);
  if (user) {
    res.send({ status: 'ok', data: { validated: true } });
  }
});

app.use(errorMiddleware);
