import express from 'express';
import {
  errorMiddleware,
  requestLoggerMiddleware,
  validateSessionMiddleware,
} from './util/middlewares.js';
import { disableOpenID, enableOpenID, isAdmin } from './account-db.js';
import { loginWithOpenIdFinalize } from './accounts/openid.js';
import UserService from './services/user-service.js';

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorMiddleware);
app.use(requestLoggerMiddleware);
export { app as handlers };

app.post('/enable', validateSessionMiddleware, async (req, res) => {
  if (!isAdmin(req.userSession.user_id)) {
    res.status(401).send({
      status: 'error',
      reason: 'unauthorized',
      details: 'permission-not-found',
    });
    return;
  }

  let { error } = (await enableOpenID(req.body)) || {};

  if (error) {
    res.status(500).send({ status: 'error', reason: error });
    return;
  }
  res.send({ status: 'ok' });
});

app.post('/disable', validateSessionMiddleware, async (req, res) => {
  if (!isAdmin(req.userSession.user_id)) {
    res.status(401).send({
      status: 'error',
      reason: 'unauthorized',
      details: 'permission-not-found',
    });
    return;
  }

  let { error } = (await disableOpenID(req.body, true, true)) || {};

  if (error) {
    res.status(400).send({ status: 'error', reason: error });
    return;
  }
  res.send({ status: 'ok' });
});

app.get('/config', async (req, res) => {
  const { cnt: ownerCount } = UserService.getOwnerCount() || {};

  if (ownerCount > 0) {
    res.status(400).send({ status: 'error', reason: 'already-bootstraped' });
    return;
  }

  const auth = UserService.getOpenIDConfig();

  if (!auth) {
    res
      .status(500)
      .send({ status: 'error', reason: 'OpenID configuration not found' });
    return;
  }

  try {
    const openIdConfig = JSON.parse(auth.extra_data);
    res.send({ openId: openIdConfig });
  } catch (error) {
    res
      .status(500)
      .send({ status: 'error', reason: 'Invalid OpenID configuration' });
  }
});

app.get('/callback', async (req, res) => {
  let { error, url } = await loginWithOpenIdFinalize(req.query);
  if (error) {
    res.status(400).send({ error });
    return;
  }

  res.redirect(url);
});
