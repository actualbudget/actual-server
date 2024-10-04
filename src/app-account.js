import express from 'express';
import {
  errorMiddleware,
  requestLoggerMiddleware,
} from './util/middlewares.js';
import validateUser, { validateAuthHeader } from './util/validate-user.js';
import getAccountDb, {
  bootstrap,
  needsBootstrap,
  getLoginMethod,
  listLoginMethods,
  enableOpenID,
  disableOpenID,
  getUserInfo,
  getUserPermissions,
} from './account-db.js';
import { changePassword, loginWithPassword } from './accounts/password.js';
import {
  loginWithOpenIdSetup,
  loginWithOpenIdFinalize,
} from './accounts/openid.js';
import { getAdminSessionFromRequest } from './app-admin.js';
import bodyParser from 'body-parser';

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorMiddleware);
app.use(requestLoggerMiddleware);
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

app.post('/bootstrap', async (req, res) => {
  let { error } = await bootstrap(req.body);

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  } else {
    res.send({ status: 'ok' });
  }
});

app.get('/login-methods', (req, res) => {
  let methods = listLoginMethods();
  res.send({ status: 'ok', methods });
});

app.post('/login', async (req, res) => {
  let loginMethod = getLoginMethod(req);
  console.log('Logging in via ' + loginMethod);
  let tokenRes = null;
  switch (loginMethod) {
    case 'header': {
      let headerVal = req.get('x-actual-password') || '';
      const obfuscated =
        '*'.repeat(headerVal.length) || 'No password provided.';
      console.debug('HEADER VALUE: ' + obfuscated);
      if (headerVal == '') {
        res.send({ status: 'error', reason: 'invalid-header' });
        return;
      } else {
        if (validateAuthHeader(req)) {
          tokenRes = loginWithPassword(headerVal);
        } else {
          res.send({ status: 'error', reason: 'proxy-not-trusted' });
          return;
        }
      }
      break;
    }
    case 'openid': {
      let { error, url } = await loginWithOpenIdSetup(req.body);
      if (error) {
        res.send({ status: 'error', reason: error });
        return;
      }
      res.send({ status: 'ok', data: { redirect_url: url } });
      return;
    }

    case 'password':
    default:
      tokenRes = loginWithPassword(req.body.password);
      break;
  }
  let { error, token } = tokenRes;

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  }

  res.send({ status: 'ok', data: { token } });
});

app.post('/enable-openid', async (req, res) => {
  const session = await getAdminSessionFromRequest(req, res);
  if (!session) return;

  let { error } = (await enableOpenID(req.body)) || {};

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  } else {
    res.send({ status: 'ok' });
  }
});

app.post('/enable-password', async (req, res) => {
  const session = await getAdminSessionFromRequest(req, res);
  if (!session) return;

  let { error } = (await disableOpenID(req.body, true, true)) || {};

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  } else {
    res.send({ status: 'ok' });
  }
});

app.get('/openid-config', async (req, res) => {
  const { cnt } =
    getAccountDb().first(
      `SELECT count(*) as cnt
   FROM users
   WHERE users.user_name <> '' and users.owner = 1`,
    ) || {};

  if (cnt > 0) {
    res.send({});
    return;
  }

  const auth =
    getAccountDb().first(
      `SELECT * FROM auth
       WHERE method = ?`,
      ['openid'],
    ) || {};

  if (!auth) {
    res.send({});
    return;
  }

  res.send({ openId: JSON.parse(auth.extra_data) });
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
  let session = validateUser(req, res);
  if (session) {
    const user = getUserInfo(session.user_id);
    let permissions = getUserPermissions(session.user_id);

    res.send({
      status: 'ok',
      data: {
        validated: true,
        userName: user?.user_name,
        permissions: permissions,
        userId: session?.user_id,
        displayName: user?.display_name,
        loginMethod: session?.auth_method,
      },
    });
  }
});
