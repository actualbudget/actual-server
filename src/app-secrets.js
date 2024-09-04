import express from 'express';
import { secretsService } from './services/secrets-service.js';
import getAccountDb, { isAdmin } from './account-db.js';
import {
  requestLoggerMiddleware,
  validateUserMiddleware,
} from './util/middlewares.js';

const app = express();

export { app as handlers };
app.use(express.json());
app.use(requestLoggerMiddleware);

app.use(validateUserMiddleware);

app.post('/', async (req, res) => {
  const { method } =
    getAccountDb().first('SELECT method FROM auth WHERE active = 1') || {};

  const { name, value } = req.body;

  if (method === 'openid') {
    const session = validateUser(req, res);
    if (!session) return;

    let canSaveSecrets = isAdmin(session.user_id);

    if (!canSaveSecrets) {
      res.status(400).send({
        status: 'error',
        reason: 'not-admin',
        details: 'You have to be admin to set secrets',
      });

      return null;
    }
  }

  secretsService.set(name, value);

  res.status(200).send({ status: 'ok' });
});

app.get('/:name', async (req, res) => {
  const name = req.params.name;
  const keyExists = secretsService.exists(name);
  if (keyExists) {
    res.sendStatus(204);
  } else {
    res.status(404).send('key not found');
  }
});
